from lxml import html
import requests
import re
import urllib
import json
import time

SETTINGS = {
    "outputfile": "movies.js",
    "date": time.strftime("%Y-%m-%d"),
    "time": "22:00"
}

class Movies(object):
    def __init__(self):
        self.movies = []
        self.skip = []

    def addMovie(self, newMovie, channel):
        """Add a new movie to the list. 
           If the movie is already in the list, append the channel to it.
           Skip the movie if no information about it can be found.
        """
        if newMovie.data[Movie.RAWTITLE] in self.skip:
            return

        for movie in self.movies:
            if movie.data[Movie.RAWTITLE] == newMovie.data[Movie.RAWTITLE]:
                movie.data[Movie.CHANNELS].append(channel)
                return

        if newMovie.getInfo():
            self.movies.append(newMovie)
        else:
            self.skip.append(newMovie.data[Movie.RAWTITLE])
            cprint("Could not retrieve information about movie "+newMovie.data[Movie.RAWTITLE])

    def write(self):
        movies = []

        for movie in self.movies:
            movies.append(movie.data)

        f = open(SETTINGS["outputfile"], 'w')
        f.write("var movies = "+json.dumps(movies)+";")

class Movie(object):
    RAWTITLE = "RawTitle"
    TIME = "Time"
    CHANNELS = "Channels"

    rx_infoquery = re.compile('\s')

    def __init__(self, title, time, channel):
        self.data = {Movie.RAWTITLE:title, Movie.TIME:time, Movie.CHANNELS:[channel]}

    def getInfo(self):

        # Create URL
        title = Movie.rx_infoquery.sub('+', self.data[Movie.RAWTITLE])
        titlestring = urllib.parse.urlencode({'t':title})
        response = urllib.request.urlopen("http://www.omdbapi.com/?"+titlestring+"&y=&plot=short&r=json&tomatoes=true")
        
        info = response.read().decode("utf-8")
        jsonString = json.loads(info)

        if jsonString["Response"] == "True":
            for key in jsonString:
                self.data[key] = jsonString[key]

            return True
        else:
            return False

def parseTVListings(movies, startHour, startMinute):
    """Extract channels and movies based on the schedule for DirecTV from aol.com"""

    channels = {}

    date = SETTINGS["date"]
    time = SETTINGS["time"]

    print("Fetching channel listings for "+date+" starting from "+time+".")

    # Fetch the TV listings and create a DOM tree
    page = urllib.request.urlopen('http://tvlistings.aol.com/listings/ca/los-angeles/directv-los-angeles/DITV803/print/'+date+'/'+time)
    tree = html.fromstring(page.read().decode("utf-8"))

    # Find all channels in the DOM tree
    channels_query = tree.xpath("//div[@class='grid-source']")
    position = getChannelPos(52)

    print("Parsing channel list...")

    for result in channels_query:
        arr = result.xpath("span/text()")

        index = next(position)
        try:
            channel = arr[0]
            network = arr[1]
            channels[index] = {"Channel":channel, "Network":network}
        except IndexError:
            cprint("Error while parsing a channel. Parse string: "+str(arr))

    # Find all movies in the DOM tree
    movies_query = tree.xpath("//a[contains(@class,'genre-movies')]")

    rx_nonalphanum = re.compile('\W+')
    rx_style = re.compile("top: (\d*)px; left: (\d*(\.\d*)?)px")

    print("Parsing movies...")

    for result in movies_query:

        # Remove junk characters from title
        title = rx_nonalphanum.sub(' ', result.text_content()).strip()

        # Get style tag
        style = result.attrib.get("style")
        res = rx_style.match(style)

        if res:
            top = res.group(1)
            left = res.group(2)

            # Find the channel
            channel = channels[top]

            # Find the start time
            starttime = ((float(left)*0.22))
            timestring = getTimeString(startHour, startMinute, starttime)

            movie = Movie(title, timestring, channel)
            movies.addMovie(movie, channel)


def getTimeString(startHour, startMinute, offset):
    """Adds the offset (which is in minutes) to the start hour and minute
    and returns a string representation of that time (HH:MM)"""

    # Get the offset in hours and minutes
    hour = int(offset/60)
    minute = int(offset%60)

    # Code to repair possible precision errors:
    # If a movie is found to start at 19:58 or 20:04, this is corrected to 20:00
    error = minute % 10
    if error > 0 and error < 5:
        minute = minute - error
    elif error > 5 and error < 10:
        minute = minute + (10 - error)
        if minute == 60:
            minute = 0
            hour = hour + 1

    # Add the offset time to the start time:
    actualHour = str(startHour + hour)
    actualMinute = str(startMinute + minute)

    # Add trailing zeros if necessary:
    if len(actualHour) == 1:
        actualHour = actualHour+"0"

    if len(actualMinute) == 1:
        actualMinute = actualMinute+"0"

    return actualHour+":"+actualMinute

def cprint(text):
    try:
        print(text)
    except UnicodeEncodeError:
        print(text.encode("utf-8"))

def getChannelPos(height):
    mul = 0
    while True:
        yield str(height*mul)
        mul += 1

if __name__ == "__main__":
    movies = Movies()
    parseTVListings(movies, 19, 0)
    movies.write()

