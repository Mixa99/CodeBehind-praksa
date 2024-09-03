const groups = require('./groups.json');
const exibitions = require('./exibitions.json');
const date = new Date('2024-08-25');

function addDays (days){
    date.setDate(date.getDate() + days);
}

function calculateForms (team1, team2){
    const minCoefficient = 0.58;
    let ptsDiffTeam1 = 0, ptsDiffTeam2 = 0;
    let winsTeam1 = 0, winsTeam2 = 0;
    let k = 0.05, x = 0;

    let statsTeam1 = exibitions[`${team1.ISOCode}`];
    statsTeam1.forEach(match => {
        ptsDiffTeam1 += parseInt(match.Result.split("-")[0]) - parseInt(match.Result.split("-")[1]);
        if(parseInt(match.Result.split("-")[0]) > parseInt(match.Result.split("-")[1])){
            winsTeam1++;
        }
    });
    let avgTeam1 = Math.floor(ptsDiffTeam1 / (statsTeam1.length));

    let statsTeam2 = exibitions[`${team2.ISOCode}`];
    statsTeam2.forEach(match => {
        ptsDiffTeam2 += parseInt(match.Result.split("-")[0]) - parseInt(match.Result.split("-")[1]);
        if(parseInt(match.Result.split("-")[0]) > parseInt(match.Result.split("-")[1])){
            winsTeam2++;
        }
    });
    let avgTeam2 = Math.floor(ptsDiffTeam2 / (statsTeam2.length));

    let winPercentage1 = winsTeam1 / statsTeam1.length;
    let winPercentage2 = winsTeam2 / statsTeam2.length;
    
    let normalizeAvg1 = 1 / (1 + Math.exp(-k * (avgTeam1 - x)));
    let normalizeAvg2 = 1 / (1 + Math.exp(-k * (avgTeam2 - x)));

    let formFactor1 = 0.5 * winPercentage1 + 0.5 * normalizeAvg1;
    let formFactor2 = 0.5 * winPercentage2 + 0.5 * normalizeAvg2;

    let rankFactor1 = (1 / team1.FIBARanking) / ((1 / team1.FIBARanking) + (1 / team2.FIBARanking));
    let rankFactor2 = (1 / team2.FIBARanking) / ((1 / team1.FIBARanking) + (1 / team2.FIBARanking));

    let winCoefficient1 = 0.7 * rankFactor1 + 0.3 * formFactor1;
    let winCoefficient2 = 0.7 * rankFactor2 + 0.3 * formFactor2;
    winCoefficient1 = Math.max(winCoefficient1, minCoefficient);
    winCoefficient2 = Math.max(winCoefficient2, minCoefficient);
    let totalWinCoeffitient = winCoefficient1 + winCoefficient2;
    winCoefficient1 /= totalWinCoeffitient;
    winCoefficient2 /= totalWinCoeffitient;

    return [winCoefficient1, winCoefficient2];
}

function simulateGame(team1, team2){

    let forms = calculateForms(team1, team2);
    
    let score1 = Math.floor((Math.random() * 20 + 160) * (forms[0]));
    let score2 = Math.floor((Math.random() * 20 + 160) * (forms[1]));

    return score1 > score2 ? {winner: team1, loser: team2, score:`${score1}-${score2}`} :
        score1 < score2 ? {winner: team2, loser: team1, score:`${score1}-${score2}`} : 
        simulateGame(team1, team2);
}

function makeResults(){
    const results = {};

    for (const group in groups) {
        results[group] = groups[group].map(team => ({
            team,
            wins: 0,
            losses: 0,
            points: 0,
            pointsFor: 0,
            pointsAgainst: 0,
        }));
    }

    return results;
}

function updateStats(game, group, results){
    results[group].forEach(element => {
        if(element.team === game.winner){
            element.wins++;
            element.points += 2;
            if(game.score.split('-')[0] > parseInt(game.score.split('-')[1])){
                element.pointsFor += parseInt(game.score.split('-')[0]);
                element.pointsAgainst += parseInt(game.score.split('-')[1]);

                exibitions[`${element.team.ISOCode}`].push({
                    "Date": `${date.getDate()}/${date.getMonth()}/${date.getFullYear().toString().slice(-2)}`,
                    "Opponent": game.loser.ISOCode,
                    "Result": `${game.score}`
                });
            } else {
                element.pointsFor += parseInt(game.score.split('-')[1]);
                element.pointsAgainst += parseInt(game.score.split('-')[0]);
                exibitions[`${element.team.ISOCode}`].push({
                    "Date": `${date.getDate()}/${date.getMonth()}/${date.getFullYear().toString().slice(-2)}`,
                    "Opponent": game.loser.ISOCode,
                    "Result": `${game.score}`
                });
            }
            
        }
        if(element.team === game.loser) {
            element.losses++;
            element.points++; 
            if(game.score.split('-')[0] > parseInt(game.score.split('-')[1])){
                element.pointsFor += parseInt(game.score.split('-')[1]);
                element.pointsAgainst += parseInt(game.score.split('-')[0]);
                exibitions[`${element.team.ISOCode}`].push({
                    "Date": `${date.getDate()}/${date.getMonth()}/${date.getFullYear().toString().slice(-2)}`,
                    "Opponent": game.winner.ISOCode,
                    "Result": `${game.score.split('-')[1]}-${game.score.split('-')[0]}`
                });
            } else {
                element.pointsFor += parseInt(game.score.split('-')[0]);
                element.pointsAgainst += parseInt(game.score.split('-')[1]);
                exibitions[`${element.team.ISOCode}`].push({
                    "Date": `${date.getDate()}/${date.getMonth()}/${date.getFullYear().toString().slice(-2)}`,
                    "Opponent": game.winner.ISOCode,
                    "Result": `${game.score.split('-')[1]}-${game.score.split('-')[0]}`
                });
            }
            
        }
    });
}

function simulateGroupStage(groups) {
    const results = makeResults();
    
    let roundNumber = 'I';

    for (let round = 0; round < 3; round++){
        console.log(`\nGrupna faza - ${roundNumber} kolo:`);
        
        for(const group in groups){
            console.log(`\n\tGrupa ${group}\n`);
            const groupTeams = groups[group];
            
            let matches;
            if (round === 0) {
                matches = [[0, 1], [2, 3]];
            } else if (round === 1) {
                matches = [[0, 2], [1, 3]];
            } else if (round === 2) {
                matches = [[0, 3], [1, 2]];
            }
            addDays(1);
            // Simulacija utakmica za trenutno kolo
            matches.forEach(([team1Id, team2Id]) => {
                let game = simulateGame(groupTeams[team1Id], groupTeams[team2Id]);
                date.setDate(date.getDate() + 1);
                updateStats(game, group, results);
                console.log(`\t\t${groupTeams[team1Id].Team} - ${groupTeams[team2Id].Team} (${game.score})`);
            });

            
            results[group].sort((a, b) => {          
                if(b.points !== a.points){
                    return b.points - a.points;
                } else if((b.pointsFor - b.pointsAgainst) !== (a.pointsFor - a.pointsAgainst)){
                    return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
                } else {   
                    let mutualResult1 = 0, mutualResult2 = 0;                
                    exibitions[`${b.team.ISOCode}`].forEach(element => {
                        if(a.ISOCode === element.Opponent && parseInt(element.Result.split('-')[0]) > parseInt(element.Result.split('-')[1])){
                            mutualResult1++;
                        } else if(a.ISOCode === element.Opponent && parseInt(element.Result.split('-')[0]) < parseInt(element.Result.split('-')[1])){
                            mutualResult2++;
                        }
                    });

                    if(mutualResult2 !== mutualResult1){
                        return b - a;
                    }
                }
            }); // proveri za medjusobni susret
        }
        
        roundNumber += 'I';
    }
    console.log('');

    return results;
}

function readGroupResults(results){
    console.log("Rezultati grupne faze:");
    
    for (const group in results){
        console.log(`\n\tGrupa ${group}: (Ime - pobede / porazi / bodovi / postignuti koševi / primljeni koševi / koš razlika):\n`);
        results[group].forEach(element => {
            console.log(`\t${element['team'].Team.padEnd(17, ' ')} - ${element.wins} / ${element.losses} / ${element.points} / ${element.pointsFor} / ${element.pointsAgainst} / ${element.pointsFor-element.pointsAgainst}`);  
        });
    }        
}

function makePots (results) {
    let newResults = [];
    let pots = {D: [], E:[], F:[], G:[]};

    for (const group in results){
        const top3 = results[group].slice(0,3);
        newResults.push(top3[0], top3[1], top3[2]);

    }

    newResults.sort((a, b) => b.wins - a.wins || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst))

    let index = 0;
    
    for (const group in pots){
        pots[group].push(newResults[index], newResults[index+1]);
        index += 2;
    }

    return pots;
    
}

function drawKOStage(pots) {
    let matches = [];
  
    // Create matches between pot D and pot G
    let potD = pots.D; // Copy of pot D
    let potG = pots.G; // Copy of pot G    
    
    let teamD1 = potD[0].team;
    let teamD1Group = findTeamGroup(teamD1.ISOCode);
    
    let teamD2 = potD[1].team;
    let teamD2Group = findTeamGroup(teamD2.ISOCode);

    let validOpponentsTeam1 = potG.filter(teamG => findTeamGroup(teamG.team.ISOCode) !== teamD1Group);
    let validOpponentsTeam2 = potG.filter(teamG => findTeamGroup(teamG.team.ISOCode) !== teamD2Group);
    if(validOpponentsTeam1.length == 1 ){
        matches.push([teamD1, validOpponentsTeam1[0].team]);
        potD.splice(potD.indexOf(teamD1), 1);
        potG.splice(potG.indexOf(validOpponentsTeam1[0]), 1); 

        matches.push([teamD2, potG[0].team]);
        potD.splice(potD.indexOf(teamD2), 1);
        potG.splice(potG.indexOf(potG[0]), 1); 
    } else if (validOpponentsTeam2.length == 1 ){
        matches.push([teamD2, validOpponentsTeam2[0].team]);
        potD.splice(potD.indexOf(teamD2), 1);
        potG.splice(potG.indexOf(validOpponentsTeam2[0]), 1); 

        matches.push([teamD1, potG[0].team]);
        potD.splice(potD.indexOf(teamD1), 1);
        potG.splice(potG.indexOf(potG[0]), 1); 

    } else {
        randomIndex = getRandomIndex(potG.length);
        let teamG = potG[randomIndex].team;

        matches.push([teamD1, teamG]);

        potD.splice(potD.indexOf(teamD1), 1);
        potG.splice(potG.indexOf(teamG), 1); 

        matches.push([teamD2, potG[0].team]);
        potD.splice(potD.indexOf(teamD2), 1);
        potG.splice(potG.indexOf(potG[0]), 1); 

    }
  
    //Create matches between pot E and pot F
    let potE = pots.E;
    let potF = pots.F; 

    let teamE1 = potE[0].team;
    let teamE1Group = findTeamGroup(teamE1.ISOCode);
    
    let teamE2 = potE[1].team;
    let teamE2Group = findTeamGroup(teamE2.ISOCode);

    let validOpponentsTeamE1 = potF.filter(teamF => findTeamGroup(teamF.team.ISOCode) !== teamE1Group);
    let validOpponentsTeamE2 = potF.filter(teamF => findTeamGroup(teamF.team.ISOCode) !== teamE2Group);

    if(validOpponentsTeamE1.length == 1 ){
        matches.push([teamE1, validOpponentsTeamE1[0].team]);
        potE.splice(potE.indexOf(teamE1), 1);
        potF.splice(potF.indexOf(validOpponentsTeamE1[0].team), 1); 

        matches.push([teamE2, potF[0].team]);
        potE.splice(potE.indexOf(teamD2), 1);
        potF.splice(potF.indexOf(potF[0]), 1); 
    } else if (validOpponentsTeamE2.length == 1 ){
        matches.push([teamE2, validOpponentsTeamE2[0].team]);
        potE.splice(potE.indexOf(teamE2), 1);
        potF.splice(potF.indexOf(validOpponentsTeam2[0]), 1); 

        matches.push([teamE1, potF[0].team]);
        potE.splice(potE.indexOf(teamE1), 1);
        potF.splice(potF.indexOf(potF[0]), 1); 
    } else {
        randomIndex = getRandomIndex(potF.length);
        let teamF = potF[randomIndex].team;

        matches.push([teamE1, teamF]);

        potE.splice(potE.indexOf(teamE1), 1);
        potF.splice(potF.indexOf(teamF), 1); 

        matches.push([teamE2, potF[0].team]);
        potE.splice(potE.indexOf(teamE2), 1);
        potF.splice(potF.indexOf(potF[0]), 1); 
    }
    
    return matches;
  }

function findTeamGroup(teamISOCode){
    for (const group in groups){
        if(groups[group].some(team => team.ISOCode === teamISOCode)){
            return group;
        }
    }
}

function getRandomIndex(length) {
    return Math.floor(Math.random() * length);
}

function readPots(pots){
    console.log('Šeširi\n');
    for (const pot in pots){
        console.log(`\tŠešir ${pot}\n`);
        pots[pot].forEach(element => {
            console.log(`\t\t${element.team.Team}`);
        }); 

    }
}

function readKOPhase(matches){
    console.log('\nŽreb za eliminacionu fazu:');
    
    matches.forEach(match => {
        console.log(`\n\t${match[0].Team} - ${match[1].Team} \t`);
    });
    
}

function playKOStage(matches){
    const remainingTeams = [];
    
    addDays(5);
    console.log('\nEliminaciona faza: ');
    console.log('\n\t Četvrtfinale: \n');
    
    let pom = matches[1];    
    matches[1] = matches[3];
    matches[3] = pom;

    matches.forEach(match => {   
        addDays(1);     
        let game = simulateGame(match[0], match[1]);
        console.log(`\t\t ${match[0].Team} - ${match[1].Team} (${game.score})\n`);
        remainingTeams.push(game.winner);
        if(match[0] === game.winner){
            if(game.score.split('-')[0] > parseInt(game.score.split('-')[1])){
                exibitions[`${match[0].ISOCode}`].push({
                    "Date": `${date.getDate()}/${date.getMonth()}/${date.getFullYear().toString().slice(-2)}`,
                    "Opponent": game.loser.ISOCode,
                    "Result": `${game.score}`
                });
            } else {
                exibitions[`${element.team.ISOCode}`].push({
                    "Date": `${date.getDate()}/${date.getMonth()}/${date.getFullYear().toString().slice(-2)}`,
                    "Opponent": game.loser.ISOCode,
                    "Result": `${game.score}`
                });
            }
            
        }
        if(match[1] === game.loser) {
            if(game.score.split('-')[0] > parseInt(game.score.split('-')[1])){
                exibitions[`${match[1].ISOCode}`].push({
                    "Date": `${date.getDate()}/${date.getMonth()}/${date.getFullYear().toString().slice(-2)}`,
                    "Opponent": game.winner.ISOCode,
                    "Result": `${game.score.split('-')[1]}-${game.score.split('-')[0]}`
                });
            } else {
                element.pointsFor += parseInt(game.score.split('-')[0]);
                element.pointsAgainst += parseInt(game.score.split('-')[1]);
                exibitions[`${match[1].ISOCode}`].push({
                    "Date": `${date.getDate()}/${date.getMonth()}/${date.getFullYear().toString().slice(-2)}`,
                    "Opponent": game.winner.ISOCode,
                    "Result": `${game.score.split('-')[1]}-${game.score.split('-')[0]}`
                });
            }
            
        }
        
    });

    return remainingTeams;
    
}

function playSemiFinal(matches){
    const finalists = [];
    const runnerUp = [];

    console.log('\n\t Polufinale: \n');
    for(let i = 0; i < 3; i++){    
        addDays(1);    
        let game = simulateGame(matches[i], matches[i+1]);
        console.log(`\t\t ${matches[i].Team} - ${matches[i+1].Team} (${game.score})\n`);
        finalists.push(game.winner);
        runnerUp.push(game.loser);
        if(matches[i] === game.winner){
            if(game.score.split('-')[0] > parseInt(game.score.split('-')[1])){
                exibitions[`${matches[i].ISOCode}`].push({
                    "Date": `${date.getDate()}/${date.getMonth()}/${date.getFullYear().toString().slice(-2)}`,
                    "Opponent": game.loser.ISOCode,
                    "Result": `${game.score}`
                });
            } else {
                exibitions[`${matches[i].ISOCode}`].push({
                    "Date": `${date.getDate()}/${date.getMonth()}/${date.getFullYear().toString().slice(-2)}`,
                    "Opponent": game.loser.ISOCode,
                    "Result": `${game.score}`
                });
            }
            
        }
        if(matches[i] === game.loser) {
            if(game.score.split('-')[0] > parseInt(game.score.split('-')[1])){
                exibitions[`${matches[i].ISOCode}`].push({
                    "Date": `${date.getDate()}/${date.getMonth()}/${date.getFullYear().toString().slice(-2)}`,
                    "Opponent": game.winner.ISOCode,
                    "Result": `${game.score.split('-')[1]}-${game.score.split('-')[0]}`
                });
            } else {
                exibitions[`${matches[i].ISOCode}`].push({
                    "Date": `${date.getDate()}/${date.getMonth()}/${date.getFullYear().toString().slice(-2)}`,
                    "Opponent": game.winner.ISOCode,
                    "Result": `${game.score.split('-')[1]}-${game.score.split('-')[0]}`
                });
            }
            
        }
        i++;
    }

    return [finalists, runnerUp];

}

function playRunnerUp(runnerUp){
    console.log('\n\t Utakmica za treće mesto: \n');
    let game = simulateGame(runnerUp[0], runnerUp[1]);
    console.log(`\t\t ${runnerUp[0].Team} - ${runnerUp[1].Team} (${game.score})`);
    return game;
}

function playFinal(finalists){
    console.log('\n\t Finale: \n');
    let game = simulateGame(finalists[0], finalists[1]);
    console.log(`\t\t ${finalists[0].Team} - ${finalists[1].Team} (${game.score})`);
    return game;
}

function awards(finalGame, runnerUpGame){
    console.log('\n Dodela medalja: \n');
    console.log(`\t1. ${finalGame.winner.Team} - Zlatna medalja\n`);
    console.log(`\t2. ${finalGame.loser.Team} - Srebrna medalja\n`);
    console.log(`\t3. ${runnerUpGame.winner.Team} - Bronzana medalja\n`);
    console.log(`\t4. ${runnerUpGame.loser.Team}\n`);
    
    
}

module.exports = {
    simulateGroupStage,
    readGroupResults,
    makePots,
    drawKOStage,
    readKOPhase,
    readPots,
    playKOStage,
    playSemiFinal,
    playRunnerUp,
    playFinal,
    awards
}

// zameni drugu i cetvrtu utakmicu nakon zreba pre ispisivanja