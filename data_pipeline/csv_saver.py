import csv
from imdb_scraper import scrape_imdb


scraped_imdb_movies_data_file_path = './data/scraped_imdb_movies_data.csv'

def save_scraped_movies_to_csv(movies_data):
  print(f'Saving {len(movies_data)} movies to {scraped_imdb_movies_data_file_path}')
  scraped_imdb_movies_data = []
  header = [
    'movieId', 'plot_summary', 'show_name', 'release_date', 'runtime', 'directors', 'writers',
    'production_companies', 'actors', 'aka_name', 'country_of_origin', 'filming_locations', 'color', 
    'budget', 'box_office_opening_weekend_label', 'box_office_opening_weekend_value', 
    'gross_worldwide', 'cover_image', 'trailer'
  ]

  with open(scraped_imdb_movies_data_file_path, 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=header)
    writer.writeheader()
    for nr, movie in enumerate(movies_data):
      print(f'Saving movie {movie["movieId"]}, nr {nr}')
      if movie['imdb_link']:
        scraped_imdb_data = scrape_imdb(movie['imdb_link'])
        scraped_imdb_data['movieId'] = movie['movieId']
        ordered_movie = {key: movie.get(key, '') for key in header}
        writer.writerow(ordered_movie)
        scraped_imdb_movies_data.append(scraped_imdb_data)

  return scraped_imdb_movies_data
  