package com.ledger.diary.repository;

import com.ledger.diary.entity.DiaryEntry;
import com.ledger.diary.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiaryEntryRepository extends JpaRepository<DiaryEntry, Long> {
    List<DiaryEntry> findAllByUserOrderByDateDescCreatedAtDesc(User user);
    Optional<DiaryEntry> findByIdAndUser(Long id, User user);
    List<DiaryEntry> findByUserAndFavouriteTrueOrderByDateDescCreatedAtDesc(User user);
    List<DiaryEntry> findByUserAndDate(User user, LocalDate date);
    long countByUser(User user);
    void deleteByUser(User user);
}
