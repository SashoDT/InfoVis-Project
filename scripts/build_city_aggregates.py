from pathlib import Path
import pandas as pd


def main():
    project_root = Path(__file__).resolve().parent.parent
    input_path = project_root / "data" / "processed" / "cleaned_airbnb.csv"
    output_path = project_root / "data" / "processed" / "city_aggregated_airbnb.csv"

    df = pd.read_csv(input_path)

    # Helper booleans for room type shares
    df["is_entire_home"] = df["room_type"] == "Entire home/apt"
    df["is_private_room"] = df["room_type"] == "Private room"
    df["is_shared_room"] = df["room_type"] == "Shared room"

    # Make the city aggregate features
    # We can add/remove easily in this file
    city_df = df.groupby("city").agg(
        listing_count=("listing_id", "count"),
        #median_price=("listing_price", "median"),
        mean_price=("listing_price", "mean"),
        mean_price_per_person=("price_per_person", "mean"),
        avg_guest_satisfaction=("guest_satisfaction", "mean"),
        avg_cleanliness=("cleanliness", "mean"),
        avg_guest_capacity=("guest_capacity", "mean"),
        avg_distance_to_center_km=("distance_to_center (km)", "mean"),
        avg_distance_to_metro_km=("distance_to_metro (km)", "mean"),
        avg_attraction_index=("attraction_index", "mean"),
        avg_restaurant_index=("restaurant_index", "mean"),
        avg_value_score=("value_score", "mean"),
        pct_listings_with_superhost=("host_is_superhost", "mean"),
        # TODO maybe rethink these as might not be very intuitive for user
        share_entire_home=("is_entire_home", "mean"),
        share_private_room=("is_private_room", "mean"),
        share_shared_room=("is_shared_room", "mean")
    ).reset_index()

    # Round columns
    round_2_cols = [
        #"median_price",
        "mean_price",
        "mean_price_per_person",
        "avg_guest_satisfaction",
        "avg_cleanliness",
        "avg_guest_capacity",
        "avg_distance_to_center_km",
        "avg_distance_to_metro_km"
    ]

    round_3_cols = [
        "avg_attraction_index",
        "avg_restaurant_index",
        "avg_value_score",
        "share_entire_home",
        "share_private_room",
        "share_shared_room",
        "pct_listings_with_superhost"
    ]

    for col in round_2_cols:
        if col in city_df.columns:
            city_df[col] = city_df[col].round(2)

    for col in round_3_cols:
        if col in city_df.columns:
            city_df[col] = city_df[col].round(3)

    city_df.to_csv(output_path, index=False)

    print("Shape:", city_df.shape)
    print(city_df.head())


if __name__ == "__main__":
    main()