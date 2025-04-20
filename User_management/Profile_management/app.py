from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from flask_wtf import FlaskForm
from wtforms import StringField, SelectMultipleField
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder='frontend')
CORS(app)
app.config['SECRET_KEY'] = 'your_secret_key'  

class ProfileForm(FlaskForm):
    user_id = StringField('User ID')
    first_name = StringField('First Name')
    last_name = StringField('Last Name')
    phone_number = StringField('Phone Number')
    address = StringField('Address')
    major = StringField('Major')
    enrolled_courses = SelectMultipleField('Enrolled Courses', choices=[('OS', 'Operating Systems'), ('DSA', 'Data Structures and Algorithms'), ('SE', 'Software Engineering')])
    previous_education = StringField('Previous Education')

# In-memory profile data
profiles = {}

@app.route('/api/profiles/<user_id>', methods=['GET'])
def get_profile(user_id):
    if user_id in profiles:
        profile_data = profiles[user_id].copy()
        profile_data['user_id'] = user_id 
        return jsonify(profile_data)
    return jsonify({"message": "Profile not found"}), 404

@app.route('/api/profiles', methods=['POST'])
def create_profile():
    form = ProfileForm(request.form)
    user_id = form.user_id.data
    if not user_id:
        return jsonify({"message": "User ID is required"}), 400
    profiles[user_id] = {
        'first_name': form.first_name.data,
        'last_name': form.last_name.data,
        'phone_number': form.phone_number.data,
        'address': form.address.data,
        'major': form.major.data,
        'enrolled_courses': form.enrolled_courses.data, 
        'previous_education': form.previous_education.data
    }
    return jsonify({"message": "Profile created successfully", "user_id": user_id}), 201

@app.route('/api/profiles/<user_id>', methods=['PUT'])
def update_profile(user_id):
    if user_id not in profiles:
        return jsonify({"message": "Profile not found"}), 404
    form = ProfileForm(request.form)
    profile_data = profiles[user_id].copy()

    profile_data.update({
        'first_name': form.first_name.data,
        'last_name': form.last_name.data,
        'phone_number': form.phone_number.data,
        'address': form.address.data,
        'major': form.major.data,
        'enrolled_courses': form.enrolled_courses.data, 
        'previous_education': form.previous_education.data
    })
    profiles[user_id] = profile_data
    return jsonify({"message": "Profile updated successfully", "user_id": user_id}), 200

@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_frontend(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)