import csv
import os
from .read_functions import get_movies_with_links_and_genres, read_tv_series
from .omdb_show_date_requester import get_show_details_by_title, get_show_details_by_id


movies_data_file_path = './data/movies_collected_data.csv'
series_data_file_path = './data/series_collected_data.csv'


def save_movies_data_to_csv(movies_data, day):
    header = [
        'movieId', 'title', 'genres', 'imdb_link', 'name', 'director', 'writer', 'actors', 'plot',
        'language', 'country_of_origin', 'awards', 'poster', 'ratings'
    ]
    file_exists = os.path.isfile(movies_data_file_path)
    # limit the number of movies to 950 per day
    start_index = day * 950
    end_index = start_index + 950
    movies_data_to_process = movies_data[start_index:end_index]

    with open(movies_data_file_path, 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=header)
        if not file_exists:
            writer.writeheader()
        for movie in movies_data_to_process:
            result = get_show_details_by_id(movie['imdb_link'].split('/')[-2])
            try:
                movie.update({
                    'name': result['Title'],
                    'director': result['Director'],
                    'writer': result['Writer'],
                    'actors': result['Actors'],
                    'plot': result['Plot'],
                    'language': result['Language'],
                    'country_of_origin': result['Country'],
                    'awards': result['Awards'],
                    'poster': result['Poster'],
                    'ratings': result['Ratings'],
                })
                ordered_movie = {key: movie.get(key, '') for key in header}
                writer.writerow(ordered_movie)
            except Exception as e:
                print(f"Error processing movie {movie['title']}: {e}")
                print(result)


def save_series_data_to_csv(series_data, day):
    header = [
        'series_id', 'vote_average', 'vote_count', 'name', 'year', 'release_date', 'genres', 'director', 'writer', 'actors', 'plot',
        'language', 'country_of_origin', 'awards', 'poster', 'ratings', 'imdb_link', 'total_seasons'
    ]
    file_exists = os.path.isfile(series_data_file_path)
    # limit the number of series to 950 per day
    start_index = day * 950
    end_index = start_index + 950
    series_data_to_process = series_data[start_index:end_index]

    with open(series_data_file_path, 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=header)
        if not file_exists:
            writer.writeheader()
        for series in series_data_to_process:
            search_title = series['title']
            if search_title.startswith("DC's "):
                search_title = search_title.replace("DC's ", "")
            if search_title.startswith("Marvel's "):
                search_title = search_title.replace("Marvel's ", "")
            result = get_show_details_by_title(search_title)
            try:
                if result['Type'] == 'series':
                    series.update({
                        'name': result['Title'],
                        'year': result['Year'],
                        'release_date': result['Released'],
                        'genres': result['Genre'],
                        'director': result['Director'],
                        'writer': result['Writer'],
                        'actors': result['Actors'],
                        'plot': result['Plot'],
                        'language': result['Language'],
                        'country_of_origin': result['Country'],
                        'awards': result['Awards'],
                        'poster': result['Poster'],
                        'ratings': result['Ratings'],
                        'imdb_link': f'https://www.imdb.com/title/{result["imdbID"]}/',
                        'total_seasons': result['totalSeasons'],
                    })
                    ordered_series = {key: series.get(key, '') for key in header}
                    writer.writerow(ordered_series)
            except Exception as e:
                print(f"Error processing series '{series['title']}', id: '{series['series_id']}', vote_average: '{series['vote_average']}', vote_count: '{series['vote_count']}'")
                if result['Error'] != 'Movie not found!':
                    print(result)


def save_movies_with_embedding_to_csv(movies_data, filename):
    header = [
        'movieId', 'title', 'genres', 'imdb_link', 'name', 'directors', 'writers', 'actors', 'plot',
        'languages', 'country_of_origin', 'awards', 'poster', 'ratings', 'embedding'
    ]

    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=header)
        writer.writeheader()
        for movie in movies_data:
            try:
                ordered_movie = {key: movie.get(key, '') for key in header}
                writer.writerow(ordered_movie)
            except Exception as e:
                print(f"Error processing movie {movie['title']}: {e}")


def save_series_with_embedding_to_csv(series_data, filename):
    header = [
        'series_id', 'vote_average', 'vote_count', 'name', 'year', 'release_date', 'genres', 'directors',
        'writers', 'actors', 'plot', 'languages', 'country_of_origin', 'awards', 'poster',
        'ratings', 'imdb_link', 'total_seasons', 'embedding'
    ]

    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=header)
        writer.writeheader()
        for serie in series_data:
            try:
                ordered_serie = {key: serie.get(key, '') for key in header}
                writer.writerow(ordered_serie)
            except Exception as e:
                print(f"Error processing serie {serie['name']}: {e}")


# movies_file_path = './data/movies.csv'
# links_file_path = './data/movie_links.csv'
# movies, genres = get_movies_with_links_and_genres(movies_file_path, links_file_path)
# save_movies_data_to_csv(movies, 10)

# series_file_path = './data/tv_series.csv'
# series = read_tv_series(series_file_path)
# save_series_data_to_csv(series, 10)
