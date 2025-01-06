from flask import Flask, request, render_template, send_file, redirect, url_for, flash
from cryptography.fernet import Fernet
import os

app = Flask(__name__)
app.secret_key = 'secret_key'

KEY_FILE = "secret.key"
if not os.path.exists(KEY_FILE):
    with open(KEY_FILE, "wb") as key_file:
        key_file.write(Fernet.generate_key())

with open(KEY_FILE, "rb") as key_file:
    SECRET_KEY = key_file.read()

cipher = Fernet(SECRET_KEY)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/encrypt", methods=["POST"])

def encrypt_file():
    if 'file' not in request.files:
        flash("Файл не найден")
        return redirect(url_for('index'))

    file = request.files['file']
    if file.filename == '':
        flash("Файл не выбран")
        return redirect(url_for('index'))

    try:
        encrypted_folder = "encrypted"
        if not os.path.exists(encrypted_folder):
            os.makedirs(encrypted_folder)

        file_data = file.read()

        encrypted_data = cipher.encrypt(file_data)

        encrypted_filename = f"encrypted_{file.filename}"
        encrypted_filepath = os.path.join(encrypted_folder, encrypted_filename)

        with open(encrypted_filepath, "wb") as encrypted_file:
            encrypted_file.write(encrypted_data)

        return send_file(encrypted_filepath, as_attachment=True, download_name=encrypted_filename)
    except Exception as e:
        flash(f"Ошибка обработки файла: {str(e)}")
        return redirect(url_for('index'))


@app.route("/decrypt", methods=["POST"])
def decrypt_file():
    if 'file' not in request.files:
        flash("Файл не найден")
        return redirect(url_for('index'))

    file = request.files['file']
    if file.filename == '':
        flash("Файл не выбран")
        return redirect(url_for('index'))

    try:
        file_data = file.read()

        decrypted_data = cipher.decrypt(file_data)

        decrypted_filename = f"decrypted_{file.filename}"
        with open(decrypted_filename, "wb") as decrypted_file:
            decrypted_file.write(decrypted_data)

        return send_file(decrypted_filename, as_attachment=True, download_name=decrypted_filename)
    except Exception as e:
        flash(f"Ошибка расшифровки файла: {str(e)}")
        return redirect(url_for('index'))


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
