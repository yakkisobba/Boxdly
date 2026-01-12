package com.boxdly.model;

import java.time.LocalDate;

public class Film {
    private String title;
    private String year;
    private int rating;        // Rating 1-10 (half stars = 1, full star = 2)
    private LocalDate watchedDate;
    private String posterUrl;
    private String filmUrl;

    public Film() {
    }

    public Film(String title, String year, int rating, LocalDate watchedDate, String posterUrl, String filmUrl) {
        this.title = title;
        this.year = year;
        this.rating = rating;
        this.watchedDate = watchedDate;
        this.posterUrl = posterUrl;
        this.filmUrl = filmUrl;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getYear() {
        return year;
    }

    public void setYear(String year) {
        this.year = year;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public LocalDate getWatchedDate() {
        return watchedDate;
    }

    public void setWatchedDate(LocalDate watchedDate) {
        this.watchedDate = watchedDate;
    }

    public String getPosterUrl() {
        return posterUrl;
    }

    public void setPosterUrl(String posterUrl) {
        this.posterUrl = posterUrl;
    }

    public String getFilmUrl() {
        return filmUrl;
    }

    public void setFilmUrl(String filmUrl) {
        this.filmUrl = filmUrl;
    }

    public double getStarRating() {
        return rating / 2.0;  
    }
}
