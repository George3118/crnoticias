import sqlite3

conn = sqlite3.connect('blog.db')
conn.execute('CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT)')
conn.close()
