-- Ledger Personal Diary Initial Reference Data
USE ledger_diary;

-- Categories
INSERT IGNORE INTO categories (name) VALUES 
('Journal'),
('Work'),
('Study'),
('Travel'),
('Gratitude'),
('Dreams');

-- Moods
INSERT IGNORE INTO moods (name) VALUES 
('Happy'),
('Sad'),
('Angry'),
('Excited'),
('Calm'),
('Stressed');

-- Quotes of the Day
INSERT IGNORE INTO quotes (text, author) VALUES 
('We write to taste life twice, in the moment and in retrospect.', 'Anais Nin'),
('Fill your paper with the breathings of your heart.', 'William Wordsworth'),
('A journal is a friend that never interrupts.', 'Unknown'),
('Write it on your heart that every day is the best day in the year.', 'R. W. Emerson'),
('The life of every person is a diary in which they mean to write one story.', 'J. M. Barrie'),
('Keep a notebook. Travel with it, sleep with it.', 'Jack London'),
('How can I know what I think till I see what I say?', 'E. M. Forster');
