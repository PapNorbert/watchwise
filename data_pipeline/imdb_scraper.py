import scrapy
from scrapy.crawler import CrawlerProcess
from scrapy import signals
from twisted.internet import reactor
from scrapy.signalmanager import dispatcher 
import json



def scrape_imdb(url):
    scraped_data = {}
    def crawler_results(spider):
        scraped_data.update(spider.results)

    dispatcher.connect(crawler_results, signal=signals.spider_closed)
    process = CrawlerProcess(settings={ 'LOG_LEVEL': 'ERROR'})
    process.crawl(ImdbSpider, page_url=url)
    process.start()  
    return scraped_data



class ImdbSpider(scrapy.Spider):
    name = 'imdb_spider'

    def __init__(self, page_url, *args, **kwargs):
        super(ImdbSpider, self).__init__(*args, **kwargs)
        self.page_url = page_url
        self.plot_url = f'{page_url}plotsummary'
        self.results = {}
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        }

    def start_requests(self):
        # set user agent to avoid being blocked by the website
        yield scrapy.Request(url=self.page_url, callback=self.parse, headers=self.headers)
        yield scrapy.Request(url=self.plot_url, callback=self.parse_plot, headers=self.headers)


    def parse(self, response):
        show_name = response.xpath("//span[@data-testid='hero__primary-text']/text()").get()
        release_date = response.xpath("//li[@data-testid='title-details-releasedate']/div/ul/li/a/text()").get()
        directors = response.xpath("//div/div/div/ul/li[@data-testid='title-pc-principal-credit']/div[preceding-sibling::*[contains(., 'Director')]]/ul/li/a/text()").getall()
        writers = response.xpath("//div/div/div/ul/li[@data-testid='title-pc-principal-credit']/div[preceding-sibling::*[contains(., 'Writers')]]/ul/li/a/text()").getall()
        actors = response.xpath('//a[contains(@href, "tt_cl_t")]/text()').getall()[:10]
        aka_name = response.xpath("//li[@data-testid='title-details-akas']/div/ul/li/span/text()").get()
        country_of_origin = response.xpath('//a[contains(@href, "country_of_origin")]/text()').get()
        filming_locations = response.xpath("//li[@data-testid='title-details-filminglocations']/div/ul/li/a/text()").getall()
        production_companies = response.xpath("//li[@data-testid='title-details-companies']/div/ul/li/a/text()").getall()
        runtime = response.xpath('//li[@data-testid="title-techspec_runtime"]/div/text()').getall()
        color = response.xpath('//li[@data-testid="title-techspec_color"]/div//a/text()').get()
        budget = response.xpath('//li[@data-testid="title-boxoffice-budget"]/div//span/text()').get()
        box_office_opening_weekend_label = response.xpath('//li[@data-testid="title-boxoffice-openingweekenddomestic"]/span/text()').get()
        box_office_opening_weekend_value = response.xpath('//li[@data-testid="title-boxoffice-openingweekenddomestic"]/div/ul/li/span/text()').getall()
        gross_worldwide = response.xpath('//li[@data-testid="title-boxoffice-cumulativeworldwidegross"]/div//span/text()').get()
        cover_image = response.xpath("//div[@data-testid='hero-media__poster']/div[1]/img/@src").get()
        
        self.results.update({
            'show_name': show_name,
            'release_date': release_date,
            'runtime': ''.join(runtime),
            'directors': directors,
            'writers': writers,
            'production_companies': production_companies,
            'actors': actors,
            'aka_name': aka_name,
            'country_of_origin': country_of_origin,
            'filming_locations': filming_locations,
            'color': color,
            'budget': budget,
            'box_office_opening_weekend_label': box_office_opening_weekend_label,
            'box_office_opening_weekend_value': ', '.join(box_office_opening_weekend_value),
            'gross_worldwide': gross_worldwide,
            'cover_image': cover_image
        })
        trailer_page = response.xpath("//a[@data-testid='videos-slate-overlay-1']/@href").get()
        yield response.follow(url=f'https://www.imdb.com{trailer_page}', callback=self.parse_trailer, headers=self.headers)

    def parse_plot(self, response):
        plot_xpath = "//div[@data-testid='sub-section-summaries']/ul/li[2]/div/div/div/div/div/text()"
        self.results.update({'plot_summary': response.xpath(plot_xpath).get()})
        return self.results

    def parse_trailer(self, response):
        response_text = response.text
        # extract trailer url from the response, found in a script tag
        start = response_text.find('<script id="__NEXT_DATA__" type="application/json">') + len('<script id="__NEXT_DATA__" type="application/json">')
        end = response_text.find('</script>', start)
        json_data = response_text[start:end]
        data = json.loads(json_data)
        video_playback_data = data['props']['pageProps']['videoPlaybackData']['video']
        playback_urls = video_playback_data['playbackURLs']
        
        # define the preferred order of video definitions
        preferred_order = ['DEF_1080p', 'DEF_720p', 'DEF_480p', 'DEF_SD']
        trailer_url = None
        # set the trailer url to the first available url in the preferred order
        for definition in preferred_order:
            for url_data in playback_urls:
                if url_data['videoDefinition'] == definition:
                    trailer_url = url_data['url']
                    break
            if trailer_url:
                break
        
        self.results.update({'trailer': trailer_url})
        return self.results


# results = scrape_imdb('https://www.imdb.com/title/tt0031210/')
# for key, value in results.items():
#     print(f"{key}: {value}")