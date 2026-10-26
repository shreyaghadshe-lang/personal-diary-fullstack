package com.ledger.diary.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "moods", uniqueConstraints = {
    @UniqueConstraint(name = "uk_moods_name", columnNames = "name")
})
public class Mood {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String name;

    public Mood() {}

    public Mood(String name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
