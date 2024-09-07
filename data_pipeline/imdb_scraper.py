import scrapy
from scrapy.crawler import CrawlerProcess
from scrapy import signals
from twisted.internet import reactor
from scrapy.signalmanager import dispatcher 



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

    def start_requests(self):
        # set user agent to avoid being blocked by the website
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        }
        yield scrapy.Request(url=self.page_url, callback=self.parse, headers=headers)
        yield scrapy.Request(url=self.plot_url, callback=self.parse_plot, headers=headers)


    def parse(self, response):
        show_name = response.xpath("//span[@data-testid='hero__primary-text']/text()").get()
        release_date = response.xpath("//li[@data-testid='title-details-releasedate']/div/ul/li/a/text()").get()
        directors = response.xpath("//div/div/div/ul/li[@data-testid='title-pc-principal-credit']/div[preceding-sibling::*[contains(., 'Director')]]/ul/li/a/text()").getall()
        writers = response.xpath("//div/div/div/ul/li[@data-testid='title-pc-principal-credit']/div[preceding-sibling::*[contains(., 'Writers')]]/ul/li/a/text()").getall()
        actors = response.xpath('//a[contains(@href, "tt_cl_t")]/text()').getall()[:10]
        storyline = response.xpath("//ul[@data-testid='storyline-plot-links']").get()
        aka_name = response.xpath("//li[@data-testid='title-details-akas']/div/ul/li/span/text()").get()
        country_of_origin = response.xpath('//a[contains(@href, "country_of_origin")]/text()').get()
        box_office = response.xpath('//*[@id="__next"]/main/div/section[1]/div/section/div/div[1]/section[12]/div[2]/ul/li/div/ul/li/span/text()').get()
        filming_locations = response.xpath("//li[@data-testid='title-details-filminglocations']/div/ul/li/a/text()").getall()
        runtime = response.xpath('//li[@data-testid="title-techspec_runtime"]/div/text()').getall()
        budget = response.xpath('//li[@data-testid="title-boxoffice-budget"]/div/text()').get()
        color = response.xpath('//*[@id="__next"]/main/div/section[1]/div/section/div/div[1]/section[13]/div[2]/ul/li[2]/div/ul/li/a/text()').get()
        production_companies = response.xpath("//li[@data-testid='title-details-companies']/div/ul/li/a/text()").getall()
        cover_image = response.xpath('//div[@class="ipc-media ipc-media--poster-27x40"]/img/@src').get()
        trailer = response.xpath('//a[@data-testid="video-play-button"]/@href').get()
        if trailer:
            trailer = response.urljoin(trailer)
        
        self.results.update({
            'show_name': show_name,
            'release_date': release_date,
            'runtime': ''.join(runtime),
            'directors': directors,
            'writers': writers,
            'production_companies': production_companies,
            'actors': actors,
            'storyline': storyline,
            'aka_name': aka_name,
            'country_of_origin': country_of_origin,
            'filming_locations': filming_locations,
            'box_office': box_office,
            'budget': budget,
            'cover_image': cover_image,
            'trailer': trailer,
            'color': color,
        })
        return self.results

    def parse_plot(self, response):
        plot_xpath = ''
        self.results.update({'plot_summary': response.xpath(plot_xpath).get()})




results = scrape_imdb('https://www.imdb.com/title/tt4154796/')
for key, value in results.items():
    print(f"{key}: {value}")