from pathlib import Path
import pandas as pd


def main():
    project_root = Path(__file__).resolve().parent.parent
    input_path = project_root / "data" / "processed" / "merged_airbnb.csv"
    output_path = project_root / "data" / "processed" / "cleaned_airbnb.csv"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(input_path)

    print("Initial shape:", df.shape)

    df.drop(columns="id", inplace=True)
    df["listing_id"] = range(0, len(df))

    # Convert boolean-like columns
    if "biz" in df.columns:
        df["biz"] = df["biz"].astype(int).astype(bool)

    if "multi" in df.columns:
        df["multi"] = df["multi"].astype(int).astype(bool)

    # Rename columns
    df = df.rename(columns={
        "realSum": "listing_price",
        "guest_satisfaction_overall": "guest_satisfaction",
        "cleanliness_rating": "cleanliness",
        "person_capacity": "guest_capacity",
        "dist": "distance_to_center (km)",
        "metro_dist": "distance_to_metro (km)",
        "attr_index_norm": "attraction_index",
        "rest_index_norm": "restaurant_index",
        "multi": "host_has_2_4_listings",
        "biz": "host_has_4_or_more_listings"
    })

    # Remove extreme price outliers
    before = len(df)
    df = df[df["listing_price"] <= 5000]
    # Explicitly show how many rows were removed
    print(f"Removed {before - len(df)} rows with price > 5000")

    # Remove invalid cleanliness values
    if "cleanliness" in df.columns:
        before = len(df)
        df = df[df["cleanliness"].between(1, 10)]
        print(f"Removed {before - len(df)} rows with invalid cleanliness values")

    # Remove invalid normalized attraction index values (scale mentioned in original dataset)
    if "attraction_index" in df.columns:
        before = len(df)
        df = df[df["attraction_index"].between(0, 100)]
        print(f"Removed {before - len(df)} rows with invalid attraction_index values")

    # Remove invalid normalized restaurant index values (scale mentioned in original dataset)
    if "restaurant_index" in df.columns:
        before = len(df)
        df = df[df["restaurant_index"].between(0, 100)]
        print(f"Removed {before - len(df)} rows with invalid restaurant_index values")

    # Drop raw versions
    df = df.drop(columns=["attr_index", "rest_index"], errors="ignore")

    # Add derived features
    # Price per person
    df["price_per_person"] = df["listing_price"] / df["guest_capacity"]

    # This is a value for money score
    # We do minMax scaling to norm price and satisfaction to (0,1)
    price_norm = ((df["listing_price"] - df["listing_price"].min()) /
                  (df["listing_price"].max() - df["listing_price"].min()))

    satisfaction_norm = ((df["guest_satisfaction"] - df["guest_satisfaction"].min()) /
                         (df["guest_satisfaction"].max() - df["guest_satisfaction"].min()))

    # We do this so that the final value_score is (0,1) and not (-1,1)
    price_score = 1 - price_norm
    df["value_score"] = 0.5 * satisfaction_norm + 0.5 * price_score

    # Round selected columns
    round_3_cols = ["price_per_person", "value_score", "attraction_index", "restaurant_index"]
    for col in round_3_cols:
        if col in df.columns:
            df[col] = df[col].round(3)

    round_2_cols = ["listing_price", "distance_to_center (km)", "distance_to_metro (km)"]
    for col in round_2_cols:
        if col in df.columns:
            df[col] = df[col].round(2)

    # Move listing_id to the first column
    cols = ["listing_id"] + [col for col in df.columns if col != "listing_id"]
    df = df[cols]

    print("Final shape:", df.shape)

    df.to_csv(output_path, index=False)


if __name__ == "__main__":
    main()