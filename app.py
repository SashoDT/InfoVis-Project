import json
from pathlib import Path

import pandas as pd
from flask import Flask, render_template

app = Flask(__name__)

app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.config['TEMPLATES_AUTO_RELOAD'] = True
@app.route("/")
def index():
    # Listing level data
    listings_df = pd.read_csv('data/processed/cleaned_airbnb.csv')
    listings_data = listings_df.to_dict('records')

    # City level data
    city_df = pd.read_csv('data/processed/city_aggregated_airbnb.csv')
    city_data = city_df.to_dict('records')

    # Send data to FE
    return render_template(
        "index.html",
        listing_data = json.dumps(listings_data),
        city_data = json.dumps(city_data)
    )

if __name__ == "__main__":
    app.run(debug=True)