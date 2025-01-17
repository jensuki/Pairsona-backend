-- DB tables



-- create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    email TEXT NOT NULL,
    birth_date DATE NOT NULL,
    location TEXT NOT NULL,
    bio TEXT,
    profile_pic TEXT,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    mbti VARCHAR(4), -- nullable, populated after quiz completion
    is_admin BOOLEAN NOT NULL DEFAULT FALSE
);

-- create matches table
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- first user instance
    user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- other user instance
    is_pending BOOLEAN DEFAULT TRUE,
    is_accepted BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- unique index to allow only 1 unique connection between two matched users
CREATE UNIQUE INDEX unique_user_pairs ON matches (
    LEAST(user1_id, user2_id),
    GREATEST(user1_id, user2_id)
);

-- create messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content VARCHAR(100) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);