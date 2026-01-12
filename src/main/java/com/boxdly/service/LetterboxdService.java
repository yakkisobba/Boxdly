package com.boxdly.service;

import com.boxdly.model.Film;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LetterboxdService {

    private static final Logger logger = LoggerFactory.getLogger(LetterboxdService.class);
    private static final String BASE_URL = "https://letterboxd.com";

    /**
     * Fetches the top 4 highest rated films for the current month
     */
    public List<Film> getTopFilmsForMonth(String username) {
        YearMonth currentMonth = YearMonth.now();
        return getTopFilmsForMonth(username, currentMonth);
    }

    /**
     * Fetches the top 4 highest rated films for a specific month
     */
    public List<Film> getTopFilmsForMonth(String username, YearMonth yearMonth) {
        logger.info("Fetching films for user: {} for month: {}", username, yearMonth);
        
        List<Film> allFilms = new ArrayList<>();
        int pageNumber = 1;
        boolean hasMorePages = true;

        while (hasMorePages) {
            try {
                String url = String.format("%s/%s/films/page/%d/", 
                    BASE_URL, username, pageNumber);
                
                logger.debug("Scraping URL: {}", url);
                
                Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .get();

                Elements filmItems = doc.select("ul.poster-list li");
                
                if (filmItems.isEmpty()) {
                    logger.info("No more films found on page {}", pageNumber);
                    hasMorePages = false;
                    break;
                }

                logger.debug("Found {} film items on page {}", filmItems.size(), pageNumber);

                for (Element item : filmItems) {
                    Film film = parseFilmGridItem(item, yearMonth);
                    if (film != null) {
                        allFilms.add(film);
                    }
                }

                pageNumber++;
                
                if (pageNumber > 10) {
                    hasMorePages = false;
                }

            } catch (Exception e) {
                logger.error("Error scraping page {}: {}", pageNumber, e.getMessage());
                hasMorePages = false;
            }
        }

        int targetYear = yearMonth.getYear();
        int targetMonth = yearMonth.getMonthValue();
        
        return allFilms.stream()
            .filter(film -> film.getWatchedDate() != null &&
                           film.getWatchedDate().getYear() == targetYear &&
                           film.getWatchedDate().getMonthValue() == targetMonth &&
                           film.getRating() > 0)
            .sorted(Comparator.comparingInt(Film::getRating).reversed())
            .limit(4)
            .collect(Collectors.toList());
    }

    /**
     * Parses a film from the grid view items
     */
    private Film parseFilmGridItem(Element item, YearMonth yearMonth) {
        try {
            Element filmDiv = item.select("div").first();
            if (filmDiv == null) return null;
            
            String filmSlug = filmDiv.attr("data-film-slug");
            if (filmSlug == null || filmSlug.isEmpty()) return null;
            
            Element img = item.select("img").first();
            String title = img != null ? img.attr("alt") : "";
            
            // Extract poster
            String posterUrl = "";
            if (img != null) {
                posterUrl = img.attr("src");
                if (posterUrl.isEmpty()) {
                    posterUrl = img.attr("data-src");
                }
            }
            
            int rating = 0;
            Element viewingData = item.select("p.poster-viewingdata").first();
            if (viewingData != null) {
                String viewingText = viewingData.text().trim();
                logger.debug("Raw viewing data text: '{}'", viewingText);

                String ratingText;
                if (viewingText.contains("Watched")) {
                    ratingText = viewingText.split("Watched")[0].trim();
                } else if (viewingText.contains("Liked")) {
                    ratingText = viewingText.split("Liked")[0].trim();
                } else {
                    ratingText = viewingText.trim();
                }
                logger.debug("Extracted rating text: '{}'", ratingText);
                rating = convertRatingToInteger(ratingText);
                logger.debug("Converted rating value: {}", rating);
            } else {
                logger.debug("No poster-viewingdata found for this item");
            }
            
            if (rating == 0) {
                return null;
            }
            
            Element yearLink = item.select("small.metadata a").first();
            String year = yearLink != null ? yearLink.text() : "";
            
            String fullPosterUrl = posterUrl;
            if (!posterUrl.startsWith("http")) {
                fullPosterUrl = posterUrl.replace("//", "https://");
            }
            
            String fullFilmUrl = BASE_URL + "/film/" + filmSlug;
            
            LocalDate watchedDate = getWatchedDateForFilm(fullFilmUrl, yearMonth);
            
            logger.debug("Parsed film: {} ({}), rating: {}, watched: {}", title, year, rating, watchedDate);
            return new Film(title, year, rating, watchedDate, fullPosterUrl, fullFilmUrl);

        } catch (Exception e) {
            logger.error("Error parsing film grid item: {}", e.getMessage());
            return null;
        }
    }
    
    private LocalDate getWatchedDateForFilm(String filmUrl, YearMonth yearMonth) {
        return LocalDate.of(yearMonth.getYear(), yearMonth.getMonthValue(), 1);
    }

    /**
     * Parses a single film entry from the diary table
     */
    private Film parseFilmEntry(Element entry, YearMonth yearMonth) {
        try {
            // Extract film title and URL
            Element filmLink = entry.select("h3.headline-3 a").first();
            if (filmLink == null) {
                filmLink = entry.select("td.td-film-details a").first();
            }
            if (filmLink == null) return null;
            
            String title = filmLink.text();
            String filmUrl = BASE_URL + filmLink.attr("href");

            // Extract year
            Element yearSpan = entry.select("small.metadata").first();
            String year = yearSpan != null ? yearSpan.text() : "";

            // Extract rating (stars)
            int rating = 0;
            Element ratingSpan = entry.select("span.rating").first();
            if (ratingSpan == null) {
                ratingSpan = entry.select(".rating").first();
            }
            if (ratingSpan != null) {
                String ratingText = ratingSpan.text();
                rating = convertRatingToInteger(ratingText);
                logger.debug("Film: {}, Rating text: '{}', Rating value: {}", title, ratingText, rating);
            } else {
                logger.debug("Film: {}, No rating found", title);
            }

            // Skip unrated films
            if (rating == 0) {
                logger.debug("Skipping unrated film: {}", title);
                return null;
            }

            // Extract watched date
            Element dateLink = entry.select("td.td-day a").first();
            if (dateLink == null) {
                dateLink = entry.select("a.date-link").first();
            }
            LocalDate watchedDate = null;
            if (dateLink != null) {
                try {
                    String dateText = dateLink.attr("href");
                    
                    String[] parts = dateText.split("/");
                    if (parts.length >= 7) {
                        int year_num = Integer.parseInt(parts[parts.length - 4]);
                        int month = Integer.parseInt(parts[parts.length - 3]);
                        int day = Integer.parseInt(parts[parts.length - 2]);
                        watchedDate = LocalDate.of(year_num, month, day);
                    }
                } catch (Exception e) {
                    logger.debug("Could not parse date: {}", e.getMessage());
                }
            }

            // Extract poster URL
            String posterUrl = "";
            Element poster = entry.select("img").first();
            if (poster != null) {
                posterUrl = poster.attr("src");
                if (posterUrl.isEmpty()) {
                    posterUrl = poster.attr("data-src");
                }
            }

            logger.debug("Successfully parsed film: {} ({}), rating: {}", title, year, rating);
            return new Film(title, year, rating, watchedDate, posterUrl, filmUrl);

        } catch (Exception e) {
            logger.error("Error parsing film entry: {}", e.getMessage());
            return null;
        }
    }

    /* Converts star rating text to integer value (e.g., "★★★½" to 7) */
    private int convertRatingToInteger(String rating) {
        int total = 0;
        
        for (char c : rating.toCharArray()) {
            if (c == '★') {
                total += 2;
            } else if (c == '½') {
                total += 1;
            }
        }
        
        return total;
    }
}
