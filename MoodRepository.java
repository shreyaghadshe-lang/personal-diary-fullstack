package com.ledger.diary.repository;

import com.ledger.diary.entity.Mood;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MoodRepository extends JpaRepository<Mood, Long> {
    Optional<Mood> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
