from flask import Flask
from flask import request, jsonify
from flask_cors import CORS  
from .service.messageService import MessageService
import json
import os
import jsonpickle
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)
app.config.from_pyfile('config.py')

messageService = MessageService()

DB_PATH = os.path.join(os.path.dirname(__file__), '../../expenses.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL,
            merchant TEXT,
            currency TEXT,
            user_id TEXT,
            source TEXT DEFAULT 'manual',
            raw_message TEXT,
            timestamp TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route('/v1/ds/message', methods=['POST'])
def handle_message():
    user_id = request.headers.get('x-user-id')
    if not user_id:
        return jsonify({'error': 'x-user-id header is required'}), 400

    message = request.json.get('message')
    source = request.json.get('source', 'manual')
    result = messageService.process_message(message)

    if result is not None:
        serialized_result = result.serialize()
        serialized_result['user_id'] = user_id

        conn = get_db()
        conn.execute('''
            INSERT INTO expenses (amount, merchant, currency, user_id, source, raw_message, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            serialized_result.get('amount'),
            serialized_result.get('merchant'),
            serialized_result.get('currency'),
            user_id,
            source,
            message,
            datetime.now().isoformat()
        ))
        conn.commit()
        conn.close()

        return jsonify(serialized_result)
    else:
        return jsonify({'error': 'Invalid message format'}), 400

@app.route('/v1/expenses', methods=['GET'])
def get_expenses():
    user_id = request.args.get('user_id')
    conn = get_db()
    if user_id:
        rows = conn.execute('SELECT * FROM expenses WHERE user_id = ? ORDER BY timestamp DESC', (user_id,)).fetchall()
    else:
        rows = conn.execute('SELECT * FROM expenses ORDER BY timestamp DESC').fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/', methods=['GET'])
def handle_get():
    return 'Hello world'

@app.route('/health', methods=['GET'])
def health_check():
    return 'OK'