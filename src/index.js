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

/*jslint node: true */

'use strict';
var Volkszaehler = require('./volkszaehler');

/**
 * App ID for the skill
 */
var APP_ID = 'amzn1.ask.skill.36303b81-991a-4854-aced-9c830ddbccac';

exports.handler = function (event, context) {
    var volkszaehler = new Volkszaehler(APP_ID);
    volkszaehler.execute(event, context);
};
