// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// bot.js is your main bot dialog entry point for handling activity types

// Import required Bot Builder
//const { ActivityTypes, CardFactory } = require('botbuilder');
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

const { ActivityTypes,
    CardFactory,
    ConversationState,
    TurnContext } = require('botbuilder');
const { ChoicePrompt,
        DialogSet,
        DialogTurnResult,
        DialogTurnStatus,
        ListStyle } = require('botbuilder-dialogs');


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

        this.ConversationState = botConfig;
        this.dialogs = new DialogSet(this.dialogState);

        const prompt = new ChoicePrompt('cardPrompt');

        // Set the choice rendering to list and then add it to the bot's DialogSet.
        prompt.style = ListStyle.list;
        this.dialogs.add(prompt);

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
            const dc = await this.dialogs.createContext(turnContext);

            const results = await dc.continueDialog();
            if (!turnContext.responded && results.status === DialogTurnStatus.empty) {
                await turnContext.sendActivity('Welcome to the Rich Cards Bot!');
                // Create the PromptOptions which contain the prompt and reprompt messages.
                // PromptOptions also contains the list of choices available to the user.
                const promptOptions = {
                    prompt: 'Please select a card:',
                    reprompt: 'That was not a valid choice, please select a card or number from 1 to 8.',
                    choices: this.getChoices()
                };

                // Prompt the user with the configured PromptOptions.
                await dc.prompt('cardPrompt', promptOptions);

            // The bot parsed a valid response from user's prompt response and so it must respond.
            } else if (results.status === DialogTurnStatus.complete) {
                await this.sendCardResponse(turnContext, results);
            }
            await this.conversationState.saveChanges(turnContext);
        }
                await context.sendActivity(`holaaaa.`);
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


        /**
     * Send a Rich Card response to the user based on their choice.
     *
     * This method is only called when a valid prompt response is parsed from the user's response to the ChoicePrompt.
     * @param {TurnContext} turnContext A TurnContext instance containing all the data needed for processing this conversation turn.
     * @param {DialogTurnResult} dialogTurnResult Contains the result from any called Dialogs and indicates the status of the DialogStack.
     */
    async sendCardResponse(turnContext, dialogTurnResult) {
        switch (dialogTurnResult.result.value) {
            case 'Animation Card':
                await turnContext.sendActivity({ attachments: [this.createAnimationCard()] });
                break;
            case 'Audio Card':
                await turnContext.sendActivity({ attachments: [this.createAudioCard()] });
                break;
            case 'Hero Card':
                await turnContext.sendActivity({ attachments: [this.createHeroCard()] });
                break;
            case 'Receipt Card':
                await turnContext.sendActivity({ attachments: [this.createReceiptCard()] });
                break;
            case 'Signin Card':
                await turnContext.sendActivity({ attachments: [this.createSignInCard()] });
                break;
            case 'Thumbnail Card':
                await turnContext.sendActivity({ attachments: [this.createThumbnailCard()] });
                break;
            case 'Video Card':
                await turnContext.sendActivity({ attachments: [this.createVideoCard()] });
                break;
            case 'All Cards':
                await turnContext.sendActivities([
                    { attachments: [this.createAnimationCard()] },
                    { attachments: [this.createAudioCard()] },
                    { attachments: [this.createHeroCard()] },
                    { attachments: [this.createReceiptCard()] },
                    { attachments: [this.createSignInCard()] },
                    { attachments: [this.createThumbnailCard()] },
                    { attachments: [this.createVideoCard()] }
                ]);
                break;
            default:
                await turnContext.sendActivity('An invalid selection was parsed. No corresponding Rich Cards were found.');
        }
    }

    /**
     * Create the choices with synonyms to render for the user during the ChoicePrompt.
     */
    getChoices() {
        const cardOptions = [
            {
                value: 'Animation Card',
                synonyms: ['1', 'animation', 'animation card']
            },
            {
                value: 'Audio Card',
                synonyms: ['2', 'audio', 'audio card']
            },
            {
                value: 'Hero Card',
                synonyms: ['3', 'hero', 'hero card']
            },
            {
                value: 'Receipt Card',
                synonyms: ['4', 'receipt', 'receipt card']
            },
            {
                value: 'Signin Card',
                synonyms: ['5', 'signin', 'signin card']
            },
            {
                value: 'Thumbnail Card',
                synonyms: ['6', 'thumbnail', 'thumbnail card']
            },
            {
                value: 'Video Card',
                synonyms: ['7', 'video', 'video card']
            },
            {
                value: 'All Cards',
                synonyms: ['8', 'all', 'all cards']
            }
        ];

        return cardOptions;
    }

    // ======================================
    // Helper functions used to create cards.
    // ======================================

    createAnimationCard() {
        return CardFactory.animationCard(
            'Microsoft Bot Framework',
            [
                { url: 'https://i.giphy.com/Ki55RUbOV5njy.gif' }
            ],
            [],
            {
                subtitle: 'Animation Card'
            }
        );
    }

    createAudioCard() {
        return CardFactory.audioCard(
            'I am your father',
            ['https://www.mediacollege.com/downloads/sound-effects/star-wars/darthvader/darthvader_yourfather.wav'],
            CardFactory.actions([
                {
                    type: 'openUrl',
                    title: 'Read more',
                    value: 'https://en.wikipedia.org/wiki/The_Empire_Strikes_Back'
                }
            ]),
            {
                subtitle: 'Star Wars: Episode V - The Empire Strikes Back',
                text: 'The Empire Strikes Back (also known as Star Wars: Episode V – The Empire Strikes Back) is a 1980 American epic space opera film directed by Irvin Kershner. Leigh Brackett and Lawrence Kasdan wrote the screenplay, with George Lucas writing the film\'s story and serving as executive producer. The second installment in the original Star Wars trilogy, it was produced by Gary Kurtz for Lucasfilm Ltd. and stars Mark Hamill, Harrison Ford, Carrie Fisher, Billy Dee Williams, Anthony Daniels, David Prowse, Kenny Baker, Peter Mayhew and Frank Oz.',
                image: 'https://upload.wikimedia.org/wikipedia/en/3/3c/SW_-_Empire_Strikes_Back.jpg'
            }
        );
    }

    createHeroCard() {
        return CardFactory.heroCard(
            'BotFramework Hero Card',
            CardFactory.images(['https://sec.ch9.ms/ch9/7ff5/e07cfef0-aa3b-40bb-9baa-7c9ef8ff7ff5/buildreactionbotframework_960.jpg']),
            CardFactory.actions([
                {
                    type: 'openUrl',
                    title: 'Get started',
                    value: 'https://docs.microsoft.com/en-us/azure/bot-service/'
                }
            ])
        );
    }

    createReceiptCard() {
        return CardFactory.receiptCard({
            title: 'John Doe',
            facts: [
                {
                    key: 'Order Number',
                    value: '1234'
                },
                {
                    key: 'Payment Method',
                    value: 'VISA 5555-****'
                }
            ],
            items: [
                {
                    title: 'Data Transfer',
                    price: '$38.45',
                    quantity: 368,
                    image: { url: 'https://github.com/amido/azure-vector-icons/raw/master/renders/traffic-manager.png' }
                },
                {
                    title: 'App Service',
                    price: '$45.00',
                    quantity: 720,
                    image: { url: 'https://github.com/amido/azure-vector-icons/raw/master/renders/cloud-service.png' }
                }
            ],
            tax: '$7.50',
            total: '$90.95',
            buttons: CardFactory.actions([
                {
                    type: 'openUrl',
                    title: 'More information',
                    value: 'https://azure.microsoft.com/en-us/pricing/details/bot-service/'
                }
            ])
        });
    }

    createSignInCard() {
        return CardFactory.signinCard(
            'BotFramework Sign in Card',
            'https://login.microsoftonline.com',
            'Sign in'
        );
    }

    createThumbnailCard() {
        return CardFactory.thumbnailCard(
            'BotFramework Thumbnail Card',
            [{ url: 'https://sec.ch9.ms/ch9/7ff5/e07cfef0-aa3b-40bb-9baa-7c9ef8ff7ff5/buildreactionbotframework_960.jpg' }],
            [{
                type: 'openUrl',
                title: 'Get started',
                value: 'https://docs.microsoft.com/en-us/azure/bot-service/'
            }],
            {
                subtitle: 'Your bots — wherever your users are talking.',
                text: 'Build and connect intelligent bots to interact with your users naturally wherever they are, from text/sms to Skype, Slack, Office 365 mail and other popular services.'
            }
        );
    }
    createVideoCard() {
        return CardFactory.videoCard(
            '2018 Imagine Cup World Championship Intro',
            [{ url: 'https://sec.ch9.ms/ch9/783d/d57287a5-185f-4df9-aa08-fcab699a783d/IC18WorldChampionshipIntro2.mp4' }],
            [{
                type: 'openUrl',
                title: 'Lean More',
                value: 'https://channel9.msdn.com/Events/Imagine-Cup/World-Finals-2018/2018-Imagine-Cup-World-Championship-Intro'
            }],
            {
                subtitle: 'by Microsoft',
                text: 'Microsoft\'s Imagine Cup has empowered student developers around the world to create and innovate on the world stage for the past 16 years. These innovations will shape how we live, work and play.'
            }
        );
    }



}

module.exports.BasicBot = BasicBot;
