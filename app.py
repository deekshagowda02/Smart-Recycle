import os
import io
import mysql.connector
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from transformers import pipeline
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# 1. MySQL database connection
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password=os.environ.get("Deeksha02@"),
        database="smart_recycling_db"
    )


# 2. Save prediction to MySQL
def save_prediction(image_filename, category, confidence, disposal_tip):
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        query = """
            INSERT INTO waste_predictions
            (image_filename, category, confidence_score, disposal_tip)
            VALUES (%s, %s, %s, %s)
        """

        cursor.execute(query, (
            image_filename,
            category,
            confidence,
            disposal_tip
        ))

        connection.commit()

    finally:
        cursor.close()
        connection.close()


# 3. Load AI waste classification model
print("Loading AI model. Please wait...")

classifier = pipeline(
    "image-classification",
    model="watersplash/waste-classification"
)

print("AI model loaded successfully!")


# 4. Disposal tips
tips = {
    "plastic": "Clean the item and check local recycling rules.",
    "paper": "Keep paper clean and dry before recycling.",
    "cardboard": "Flatten cardboard boxes and keep them dry.",
    "metal": "Rinse cans and recycle them according to local rules.",
    "green-glass": "Separate glass and follow local recycling rules.",
    "white-glass": "Separate glass and follow local recycling rules.",
    "biological": "Compost suitable food and garden waste.",
    "battery": "Take batteries to an authorised collection centre.",
    "clothes": "Donate wearable clothes or find textile recycling.",
    "shoes": "Donate usable shoes or find a collection point.",
    "trash": "Dispose of general waste according to local rules."
}


# 5. Home route
@app.route("/")
def home():
    return "ReCycle AI backend is running!"


# 6. Predict waste and save to database
@app.route("/predict", methods=["POST"])
def predict():

    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]

    if not file.filename:
        return jsonify({"error": "Please select an image"}), 400

    image_filename = secure_filename(file.filename)

    try:
        image = Image.open(
            io.BytesIO(file.read())
        ).convert("RGB")

        results = classifier(image)

        best = results[0]
        category = best["label"]
        confidence = round(float(best["score"]) * 100, 2)

        tip = tips.get(
            category.lower(),
            "Follow your local waste-disposal guidelines."
        )

        # Save the prediction in MySQL
        save_prediction(
            image_filename,
            category,
            confidence,
            tip
        )

        # Return the result to Java/frontend
        return jsonify({
            "category": category,
            "confidence": confidence,
            "tip": tip,
            "message": "Prediction saved successfully"
        }), 200

    except Exception as error:
        print("Error:", error)

        return jsonify({
            "error": "Image prediction or database saving failed."
        }), 500


# 7. Start Flask server
if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )