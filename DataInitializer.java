package com.ledger.diary.config;

import com.ledger.diary.entity.Category;
import com.ledger.diary.entity.Mood;
import com.ledger.diary.entity.Quote;
import com.ledger.diary.repository.CategoryRepository;
import com.ledger.diary.repository.MoodRepository;
import com.ledger.diary.repository.QuoteRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepo;
    private final MoodRepository moodRepo;
    private final QuoteRepository quoteRepo;

    public DataInitializer(CategoryRepository categoryRepo, MoodRepository moodRepo, QuoteRepository quoteRepo) {
        this.categoryRepo = categoryRepo;
        this.moodRepo = moodRepo;
        this.quoteRepo = quoteRepo;
    }

    @Override
    public void run(String... args) {
        if (categoryRepo.count() == 0) {
            List<String> categories = List.of("Journal", "Work", "Study", "Travel", "Gratitude", "Dreams");
            for (String c : categories) {
                categoryRepo.save(new Category(c));
            }
        }

        if (moodRepo.count() == 0) {
            List<String> moods = List.of("Happy", "Sad", "Angry", "Excited", "Calm", "Stressed");
            for (String m : moods) {
                moodRepo.save(new Mood(m));
            }
        }

        if (quoteRepo.count() == 0) {
            quoteRepo.save(new Quote("We write to taste life twice, in the moment and in retrospect.", "Anais Nin"));
            quoteRepo.save(new Quote("Fill your paper with the breathings of your heart.", "William Wordsworth"));
            quoteRepo.save(new Quote("A journal is a friend that never interrupts.", "Unknown"));
            quoteRepo.save(new Quote("Write it on your heart that every day is the best day in the year.", "R. W. Emerson"));
            quoteRepo.save(new Quote("The life of every person is a diary in which they mean to write one story.", "J. M. Barrie"));
            quoteRepo.save(new Quote("Keep a notebook. Travel with it, sleep with it.", "Jack London"));
            quoteRepo.save(new Quote("How can I know what I think till I see what I say?", "E. M. Forster"));
        }
    }
}
