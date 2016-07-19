# betfriend-mean

Thinkful Unit 2 Portfolio Exercise - MEAN stack app to predict results of next Grand Prix race.

![Screenshots](http://jonwade.digital/hosted-projects/github-images/betfriend-mobile-screenshots.png)

## Overview

BetFriend is an app which is designed to analyse historical Formula 1 performance data for drivers and constructors, work out their likelihood of success at the next race in the calendar and compare to online bookmakers odds for the same outcome to identify any potential pricing discrepancies.

##Use Case

Why is this app useful? There are over 600 million people watching Formula 1 on television around the world during each race and they're all fascinated with who is going to win the next race. A lot of those fans bet on the outcome to add a bit of extra interest to the race. In theory, this app *could* make better predictions of the odds of a driver winning the next race than the bookies, and in so doing could highlight potential profit opportunities in the betting market. In other words, the app provides betting fans an edge when they're placing their bets on the race.

##UX

The initial mobile wireframes can be seen below:

![Initial Wireframes](http://jonwade.digital/hosted-projects/github-images/betfriend-wireframe-image.jpg)

The app has been designed with a focus on strong, impactful Formula 1 photography used as background images and from a mobile-first perspective. The home screen displays the next race in the calendar, with a decreasing countdown to the beginning of that race. By clicking on the ‘Get Prediction’ button, the user is taken through to the Prediction template. That template shows a grid line-up with the predicted positions of the drivers based on an algorithm that analyses historic driver and manufacturer performance data. The sliders at the top of the page allow the user to change the assumptions in the algorithm. The top slider allows the balance between current season performance and historic track performance (over past 10 years) to be altered in the algorithm. The second slider allows the balance between driver performance and constructor performance to be altered. As the sliders are altered, the grid order will dynamically change to represent the new race result prediction. For each driver, the predicted odds of winning the race are then compared to the odds of winning published online by BetFair.

##Working Prototype

You can access a working prototype of the app here: http://betfriend-f1.com

##Technical

* The app is built using the MEAN stack. The front-end is built using AngularJS, the back-end using NodeJS with ExpressJS as the web server and MongoDB as the database.
* The app draws data from two sources. The first, a historical Formula 1 data service (http://ergast.com/mrd/). This API provides historic performance data going back to the beginning of Formula 1 as a sport, for both drivers and car constructors. The second source is provided by BetFair (http://www.betfair.com), an online gambling service. BetFair provides a developer API for a fee, but to minimize costs for the prototype app, a screen-scraping approach to data collection has been implemented, returning the grid for the next race along with winning odds for each driver.
* Data is refreshed into the database on an hourly basis.
* An API to access the database has been constructed in ExpressJS with 3 key endpoints, returning race calendar, driver and manufacturer performance data respectively.
* All routing is handled in the front-end by Angular.
* The prototype app is deployed in a Ubuntu 14.04 environment with availability provided and monitored by pm2
* The calculation of odds is based on the following historic data:
    * the driver’s previous finishing positions at the track (going back a maximum 10 years).
    * the driver’s car’s (constructor’s) previous finishing positions at the track (going back a maximum of 10 years).
    * the driver’s current season performance as measured by his points total.
    * the constructor’s current season performance as measured by its points total.
* A weighting of these criteria is applied to create a prediction of the overall likelihood of a driver winning. This weighting can be tailored by the user in-app to suit their own preferences.
* The app is designed and built from a ‘mobile first’ perspective using responsive design techniques.

##Development Roadmap

This is v1.0 of the app, but future enhancements are expected to include:

* Providing profile pages showing details about the driver along with the driver’s season record and historic track performance which is used in the prediction algorithm.
* Providing profile pages showing details about the constructor along with the constructor’s season record and historic track performance which is used in the prediction algorithm.
* A track profile page providing information about the forthcoming race venue.
* Introducing other data variables into the prediction algorithm (e.g. weather forecast (rain, temperature), driver’s home grand prix advantage, qualifying grid position, fastest lap times at circuit etc).
* Allowing a bet to be placed on BetFair via the app, initially via a clickable link to the BetFair site, and in time, through integration of the BetFair API into the app.
