from flask import Flask, render_template, request, redirect
import sqlite3

app = Flask(__name__)

def get_db():
    conn = sqlite3.connect('blog.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    db = get_db()
    posts = db.execute('SELECT * FROM posts ORDER BY id DESC').fetchall()
    return render_template('index.html', posts=posts)

@app.route('/new', methods=['GET', 'POST'])
def new_post():
    if request.method == 'POST':
        title = request.form['title']
        content = request.form['content']
        db = get_db()
        db.execute('INSERT INTO posts (title, content) VALUES (?, ?)', (title, content))
        db.commit()
        return redirect('/')
    return render_template('new_post.html')

@app.route('/post/<int:post_id>')
def view_post(post_id):
    db = get_db()
    post = db.execute('SELECT * FROM posts WHERE id = ?', (post_id,)).fetchone()
    if post is None:
        return "Post not found", 404
    return render_template('view_post.html', post=post)

if __name__ == '__main__':
    app.run(debug=True)
