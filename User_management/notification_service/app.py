from flask import Flask
import os
from pymongo import MongoClient
from datetime import datetime

app = Flask(__name__)

# MongoDB connection details
MONGO_HOST = os.environ.get('MONGO_HOST', 'notification-mongo')
MONGO_PORT = int(os.environ.get('MONGO_PORT', 27017))
MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME', 'notification_db')

def get_mongo_client():
    client = MongoClient(host=MONGO_HOST, port=MONGO_PORT)
    return client

def create_in_app_notification(user_id, notification_type, message):
    client = get_mongo_client()
    db = client[MONGO_DB_NAME]
    notifications_collection = db['in_app_notifications']
    notification = {
        'user_id': user_id,
        'notification_type': notification_type,
        'message': message,
        'created_at': datetime.utcnow(),
        'is_read': False
    }
    notifications_collection.insert_one(notification)
    client.close()

@app.route('/')
def index():
    return "Notification Microservice is running with MongoDB!"

@app.route('/test-in-app-notification/<user_id>')
def test_in_app_notification(user_id):
    create_in_app_notification(user_id, 'assignment_reminder', 'Your assignment deadline is approaching!')
    return f"In-app notification created for user: {user_id} in MongoDB"

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5004)