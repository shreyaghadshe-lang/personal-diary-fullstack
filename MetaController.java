package com.ledger.diary.controller;

import com.ledger.diary.entity.Category;
import com.ledger.diary.entity.Mood;
import com.ledger.diary.entity.Quote;
import com.ledger.diary.repository.CategoryRepository;
import com.ledger.diary.repository.MoodRepository;
import com.ledger.diary.repository.QuoteRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/meta")
public class MetaController {

    private final CategoryRepository categoryRepo;
    private final MoodRepository moodRepo;
    private final QuoteRepository quoteRepo;

    public MetaController(CategoryRepository categoryRepo, MoodRepository moodRepo, QuoteRepository quoteRepo) {
        this.categoryRepo = categoryRepo;
        this.moodRepo = moodRepo;
        this.quoteRepo = quoteRepo;
    }

    @GetMapping("/categories")
    public List<String> getCategories() {
        return categoryRepo.findAll().stream().map(Category::getName).toList();
    }

    @GetMapping("/moods")
    public List<String> getMoods() {
        return moodRepo.findAll().stream().map(Mood::getName).toList();
    }

    @GetMapping("/quotes")
    public List<Quote> getQuotes() {
        return quoteRepo.findAll();
    }
}
