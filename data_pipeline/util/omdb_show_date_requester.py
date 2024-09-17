import requests
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('OMDB_API_KEY')

def get_show_details_by_id(id):
    url = f"http://www.omdbapi.com/?i={id}&apikey={api_key}&plot=full"
    response = requests.get(url)
    data = response.json()
    return data

def get_show_details_by_title(title):
    url = f"http://www.omdbapi.com/?t={title}&apikey={api_key}&plot=full"
    response = requests.get(url)
    data = response.json()
    return data
