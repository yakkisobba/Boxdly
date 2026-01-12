package com.boxdly.controller;

import com.boxdly.model.Film;
import com.boxdly.service.LetterboxdService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.List;

@Controller
public class BoxdlyController {

    @Autowired
    private LetterboxdService letterboxdService;

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/search")
    public String search(@RequestParam String username, Model model) {
        try {
            List<Film> topFilms = letterboxdService.getTopFilmsForMonth(username);
            model.addAttribute("films", topFilms);
            model.addAttribute("username", username);
            model.addAttribute("month", YearMonth.now().toString());
            return "results";
        } catch (Exception e) {
            model.addAttribute("error", "Error fetching data for user: " + username);
            return "index";
        }
    }

    @GetMapping("/api/films/{username}")
    @ResponseBody
    public ResponseEntity<List<Film>> getTopFilms(@PathVariable String username) {
        try {
            List<Film> topFilms = letterboxdService.getTopFilmsForMonth(username);
            return ResponseEntity.ok(topFilms);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
