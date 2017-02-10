/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This simple sample has no external dependencies or session management, and shows the most basic
 * example of how to create a Lambda function for handling Alexa Skill requests.
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, tell Hello World to say hello"
 *  Alexa: "Hello World!"
 */

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * volkszaehler is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var Volkszaehler = function (appId) {
    AlexaSkill.call(this, appId);
};

// Extend AlexaSkill
Volkszaehler.prototype = Object.create(AlexaSkill.prototype);
Volkszaehler.prototype.constructor = Volkszaehler;

Volkszaehler.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("Volkszaehler onSessionStarted requestId: " + sessionStartedRequest.requestId +
        ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

Volkszaehler.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("Volkszaehler onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to the Alexa Skills Kit, you can say hello";
    var repromptText = "You can say hello";
    response.ask(speechOutput, repromptText);
};

Volkszaehler.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("Volkszaehler onSessionEnded requestId: " + sessionEndedRequest.requestId +
        ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

Volkszaehler.prototype.intentHandlers = {
    // register custom intent handlers
    "CurrentValueIntent": function (intent, session, response) {
        response.tellWithCard("Current Value Intent");
    },
    "TotalConsumptionIntent": function (intent, session, response) {
        response.tellWithCard("Total Consumption Intent");
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can say hello to me!", "You can say hello to me!");
    }
};


// Extend AlexaSkill
// ScoreKeeper.prototype = Object.create(AlexaSkill.prototype);
// ScoreKeeper.prototype.constructor = ScoreKeeper;

// eventHandlers.register(ScoreKeeper.prototype.eventHandlers, skillContext);
// intentHandlers.register(ScoreKeeper.prototype.intentHandlers, skillContext);

module.exports = Volkszaehler;
