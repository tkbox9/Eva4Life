// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// bot.js is your main bot dialog entry point for handling activity types

// Import required Bot Builder
const { ActivityTypes, CardFactory } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');

const { WelcomeCard } = require('./welcomeCard');

// LUIS service type entry as defined in the .bot file.
const LUIS_CONFIGURATION = 'BasicBotLuisApplication';

// Supported LUIS Intents.
const GREETING_INTENT = 'Greeting';
const CANCEL_INTENT = 'Cancel';
const HELP_INTENT = 'Help';
const DATA_PRIVACY = 'DataPrivacy';
const NONE_INTENT = 'None';


/**
 * Demonstrates the following concepts:
 *  Displaying a Welcome Card, using Adaptive Card technology
 *  Use LUIS to model Greetings, Help, and Cancel interactions
 */
class BasicBot {
    /**
     * Constructs the necessary pieces for this bot to operate:
     * 1. LUIS client
     *
     * @param {BotConfiguration} botConfig contents of the .bot file
     */
    constructor(botConfig) {
        if (!botConfig) throw ('Missing parameter.  botConfig is required');

        // Add the LUIS recognizer.
        const luisConfig = botConfig.findServiceByNameOrId(LUIS_CONFIGURATION);
        if (!luisConfig || !luisConfig.appId) throw ('Missing LUIS configuration. Please follow README.MD to create required LUIS applications.\n\n');
        this.luisRecognizer = new LuisRecognizer({
            applicationId: luisConfig.appId,
            endpoint: luisConfig.getEndpoint(),
            // CAUTION: Its better to assign and use a subscription key instead of authoring key here.
            endpointKey: luisConfig.authoringKey
        });

    }

    /**
     * Driver code that does one of the following:
     * 1. Display a welcome card upon receiving ConversationUpdate activity 
     * 2. Use LUIS to recognize intents for incoming user message
     * 3. Start a greeting dialog
     * 4. Optionally handle Cancel or Help interruptions
     *
     * @param {Context} context turn context from the adapter
     */
    async onTurn(context) {
        // Handle Message activity type, which is the main activity type for shown within a conversational interface
        // Message activities may contain text, speech, interactive cards, and binary or unknown attachments.
        // see https://aka.ms/about-bot-activity-message to learn more about the message and other activity types        
        if (context.activity.type === ActivityTypes.Message) {

            // Perform a call to LUIS to retrieve results for the current activity message.
            const results = await this.luisRecognizer.recognize(context);
            const topIntent = LuisRecognizer.topIntent(results);

            // Determine what we should do based on the top intent from LUIS.
            switch (topIntent) {
            case GREETING_INTENT:
                await context.sendActivity(`Hello.`);
            break;
            case DATA_PRIVACY:
                await context.sendActivity(`Oh I see, data is very important and we...`);
                await context.sendActivity(`No worries`);
            break;            
            case HELP_INTENT:
                await context.sendActivity(`No worries, Let me try to provide some help.`);
                await context.sendActivity(`I understand greetings, being asked for help, or being asked to cancel what I am doing.`);
            break;
            case CANCEL_INTENT:
                await context.sendActivity(`I have nothing to cancel.`);
            break;
            case NONE_INTENT:
            default:
                // None or no intent identified, either way, let's provide some help
                // to the user
                await context.sendActivity(`I didn't understand what you just said to me.`);
                break;
            }
                
        }
        // Handle ConversationUpdate activity type, which is used to indicates new members add to 
        // the conversation. 
        // see https://aka.ms/about-bot-activity-message to learn more about the message and other activity types
        else if (context.activity.type === ActivityTypes.ConversationUpdate) {
            // Do we have any new members added to the conversation?
            if (context.activity.membersAdded.length !== 0) {
                // Iterate over all new members added to the conversation
                for (var idx in context.activity.membersAdded) {
                    // Greet anyone that was not the target (recipient) of this message
                    // the 'bot' is the recipient for events from the channel,
                    // context.activity.membersAdded == context.activity.recipient.Id indicates the
                    // bot was added to the conversation.
                    if (context.activity.membersAdded[idx].id !== context.activity.recipient.id) {
                        // Welcome user.
                        // When activity type is "conversationUpdate" and the member joining the conversation is the bot
                        // we will send our Welcome Adaptive Card.  This will only be sent once, when the Bot joins conversation
                        // To learn more about Adaptive Cards, see https://aka.ms/msbot-adaptivecards for more details.
                        const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);
                        await context.sendActivity({ attachments: [welcomeCard] });
                    }
                }
            }
        }
    }
}

module.exports.BasicBot = BasicBot;
