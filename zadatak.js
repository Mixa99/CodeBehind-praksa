const groups = require('./groups.json');
const exibitions = require('./exibitions.json');
const controller = require('./controller.js');


const groupResults = controller.simulateGroupStage(groups);
controller.readGroupResults(groupResults);
const pots = controller.makePots(groupResults);
controller.readPots(pots);

const matches = controller.drawKOStage(pots);

controller.readKOPhase(matches);
const koStage = controller.playKOStage(matches);

const semifinal = controller.playSemiFinal(koStage);

const runnerUp = semifinal[1];
const finalists = semifinal[0];

const runnerUpGame = controller.playRunnerUp(runnerUp);
const finalGame = controller.playFinal(finalists);

controller.awards(finalGame, runnerUpGame);







