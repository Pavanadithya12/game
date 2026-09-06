CREATE TABLE IF NOT EXISTS words (
  id serial PRIMARY KEY,
  word varchar(100) UNIQUE,
  category varchar(50),
  difficulty int DEFAULT 1
);

CREATE TABLE IF NOT EXISTS rooms (
  id varchar PRIMARY KEY,
  name varchar,
  host_id varchar,
  status varchar DEFAULT 'lobby',
  max_players int DEFAULT 8,
  total_rounds int DEFAULT 3,
  turn_duration int DEFAULT 60,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS games (
  id varchar PRIMARY KEY,
  room_id varchar REFERENCES rooms(id),
  current_round int DEFAULT 1,
  phase varchar DEFAULT 'waiting',
  current_drawer_id varchar,
  current_word varchar,
  draw_order jsonb,
  draw_order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rounds_history (
  id serial PRIMARY KEY,
  game_id varchar REFERENCES games(id),
  round_number int,
  drawer_id varchar,
  word varchar,
  started_at timestamptz,
  ended_at timestamptz
);

CREATE TABLE IF NOT EXISTS guesses (
  id serial PRIMARY KEY,
  game_id varchar REFERENCES games(id),
  round_number int,
  player_id varchar,
  player_name varchar,
  guess_text varchar,
  result varchar,
  points_earned int DEFAULT 0,
  timestamp bigint
);
