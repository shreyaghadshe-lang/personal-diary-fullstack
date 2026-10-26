# Ledger — Personal Diary (Full Stack Application)

A calm, paper-inspired personal diary application featuring an **HTML5/CSS3/Vanilla JavaScript** frontend connected to a **Java Spring Boot 3 + Spring Security + Spring Data JPA + MySQL 8** backend.

---

## 1. Project Overview

The original Ledger branding, typography, paper textures, animations, and three themes (`Light`, `Dark`, `Vintage`) have been **100% preserved**. 

Persistent diary data, user accounts, and settings are no longer confined to browser `localStorage`. Instead, they are stored securely in a relational **MySQL 8** database via Spring Boot REST APIs with server-side authentication, BCrypt password hashing, and per-user data isolation.

---

## 2. Technology Stack

- **Frontend**: HTML5, CSS3 ("Bound Ledger" design system), Vanilla JavaScript (no frameworks, no build step).
- **Backend**: Java 17+ (tested with Java 25 LTS), Spring Boot 3.3.5.
- **Security**: Spring Security 6, BCrypt password encoder, HTTP session cookie management.
- **Data & ORM**: Spring Data JPA, Hibernate, MySQL Connector/J.
- **Database**: MySQL 8.x (InnoDB engine, `utf8mb4_unicode_ci`).
- **Build Tool**: Apache Maven.

---

## 3. Directory Structure

```text
personal-diary/
├── pom.xml                                    # Maven configuration & dependencies
├── run.bat                                    # Convenient Windows launch script
├── .env.example                               # Safe environment variables template
├── README.md                                  # Complete documentation & guide
├── backup_original_frontend/                  # Pristine backup of original frontend
├── database/                                  # MySQL SQL initialization scripts
│   ├── 01_create_database.sql                 # Database & charset setup
│   ├── 02_schema_reference.sql                # Full reference schema DDL
│   └── 03_sample_data.sql                     # Seed categories, moods & quotes
└── src/
    ├── main/
    │   ├── java/com/ledger/diary/
    │   │   ├── LedgerDiaryApplication.java    # Spring Boot entry point
    │   │   ├── config/                        # Security & data initialization
    │   │   ├── controller/                    # REST API controllers & error advice
    │   │   ├── dto/                           # Request & response records
    │   │   ├── entity/                        # JPA Hibernate entities
    │   │   ├── repository/                    # Spring Data JPA repositories
    │   │   └── service/                       # Business logic & streak management
    │   └── resources/
    │       ├── application.properties         # Database connection & server settings
    │       └── static/                        # Served frontend (index.html, styles.css, app.js)
    └── test/
        ├── java/com/ledger/diary/             # Automated integration tests
        └── resources/application-test.properties # In-memory H2 test database
```

---

## 4. MySQL Setup Instructions

### Option A: Using MySQL Workbench

1. Launch **MySQL Workbench** and connect to your local MySQL instance (port `3306`).
2. Open File -> Open SQL Script and select `database/01_create_database.sql`.
3. Click the **Execute (Lightning bolt)** button to create the `ledger_diary` database.
4. (Optional) Run `database/03_sample_data.sql` to pre-seed master categories, moods, and quotes. *(Note: Spring Boot's `DataInitializer` also automatically populates these on initial startup if tables are empty).*

### Option B: Using MySQL Command Line Client

Open Command Prompt or MySQL Client and run:

```sql
CREATE DATABASE IF NOT EXISTS ledger_diary CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 5. Configuring Database Credentials

Open `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://${MYSQL_HOST:localhost}:${MYSQL_PORT:3306}/${MYSQL_DATABASE:ledger_diary}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata&createDatabaseIfNotExist=true
spring.datasource.username=${MYSQL_USERNAME:root}
spring.datasource.password=${MYSQL_PASSWORD:root}
```

- If your MySQL `root` user password is `root`, no changes are needed.
- If your MySQL password is different (for example `admin123`), either:
  1. Set an environment variable: `set MYSQL_PASSWORD=admin123`
  2. Or update the fallback directly in `application.properties`: `${MYSQL_PASSWORD:admin123}`

---

## 6. How to Build & Run

### Method 1: Using the Windows `run.bat` script
Double-click `run.bat` in the project root directory.

### Method 2: Using the Terminal / VS Code

```powershell
# Set Java 17/25 home if not in PATH
$env:JAVA_HOME = "C:\Program Files\Java\jdk-25"

# Run Spring Boot via Maven
mvn spring-boot:run
```

*(If `mvn` is not installed in your global PATH, use the bundled Maven at `..\apache-maven-3.10.0-bin\apache-maven-3.10.0\bin\mvn.cmd`).*

Once started, open your browser and visit:
👉 **`http://localhost:8080`**

---

## 7. REST API Documentation

### Authentication (`/api/auth`)
- **`POST /api/auth/register`**: Register new user.
  - Body: `{"name": "Alice", "username": "alice", "password": "password123"}`
  - Returns: `201 Created` with `{"id": 1, "name": "Alice", "username": "alice"}`
- **`POST /api/auth/login`**: Authenticate session.
  - Body: `{"username": "alice", "password": "password123"}`
  - Returns: `200 OK` with `{"id": 1, "name": "Alice", "username": "alice"}`
- **`GET /api/auth/me`**: Get currently authenticated user details.
- **`POST /api/auth/logout`**: Invalidate session and clear cookies (`204 No Content`).

### Diary Entries (`/api/entries`)
- **`GET /api/entries`**: List user's entries (sorted newest first). For private entries (`locked: true`), content is redacted to `null`.
- **`GET /api/entries/{id}`**: Get entry details.
- **`POST /api/entries`**: Create new diary page.
  - Body: `{"date": "2026-10-25", "title": "A quiet autumn", "mood": "Calm", "category": "Journal", "content": "Today was peaceful...", "image": null, "favourite": false, "locked": false}`
- **`PUT /api/entries/{id}`**: Update existing entry.
- **`DELETE /api/entries/{id}`**: Delete entry (`204 No Content`).
- **`PATCH /api/entries/{id}/favorite`**: Toggle favourite star.
- **`POST /api/entries/{id}/unlock`**: Unlock private entry.
  - Body: `{"password": "password123"}`
  - Returns: Full entry including private content if password matches.

### Settings (`/api/settings`)
- **`GET /api/settings`**: Get theme, reminders flag, and reminder time.
- **`PUT /api/settings`**: Update user preferences (`{"theme": "vintage", "reminders": true, "reminderTime": "21:00"}`).
- **`PUT /api/settings/password`**: Update account password (`{"currentPassword": "...", "newPassword": "..."}`).

### Backup & Restore (`/api/backup`)
- **`GET /api/backup`**: Export user entries and settings as downloadable JSON.
- **`POST /api/backup/restore`**: Restore entries from JSON within a database transaction.

---

## 8. Automated Test Results

The backend includes comprehensive integration tests in [`LedgerDiaryApplicationTests.java`](file:///c:/Users/Shreya%20Ghadshe/OneDrive/Desktop/CLG%20CODES/IP%20project/personal-diary/src/test/java/com/ledger/diary/LedgerDiaryApplicationTests.java) executed against an in-memory test database:

```text
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

Tested operations:
1. ✅ User registration & BCrypt password hashing.
2. ✅ Unique username enforcement (duplicate usernames rejected).
3. ✅ Locked/private entry content redaction on listing.
4. ✅ Secure password unlocking of private entries.
5. ✅ Strict multi-tenant isolation (User B cannot access or modify User A's records).
6. ✅ Favourites toggling & settings persistence.
