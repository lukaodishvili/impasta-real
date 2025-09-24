import { useState, useEffect, useCallback } from 'react';
import { Player, GameState, GameMode, WordPack, GamePack, PlayerRole, WinnerType } from './types';
import { assignRoles, generateRoomCode, getRandomImpostorCount } from './utils/gameUtils';
import { createBot, generateBotAnswer, generateBotVotes } from './utils/botUtils';
import { getRandomQuestion, getRandomImpostorQuestion, getRandomWord, determineWinner, generateJesterClues } from './utils/gameLogic';
import CustomQuestionCreationScreen from './components/CustomQuestionCreationScreen';
import CustomWordCreationScreen from './components/CustomWordCreationScreen';
// import { getTestQuestionPack } from './data/testQuestionPacks';
// import { useLocalStorage } from './hooks/useLocalStorage';

// Helper function for voting results processing
const processVotingResults = (
  allVotes: Record<string, string[]>,
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  setCurrentScreen: (screen: string) => void,
  determineWinner: (gameState: GameState, players: Player[], eliminatedPlayers: string[]) => { winners: Player[]; winnerType?: WinnerType }
) => {

  // --- NEW: TIE-BREAKER RESULT LOGIC FOR NORMAL MODE ---
  if (gameState.isTieVote && !gameState.isRandomizeMode) {
    console.log('Processing tie-breaker results for normal mode...');
    
    const tiedPlayerIds = new Set(gameState.tiedPlayers);
    const tieBreakerVoteCounts: { [key: string]: number } = {};
    
    // Initialize tied players with 0 votes
    gameState.tiedPlayers?.forEach(pId => tieBreakerVoteCounts[pId] = 0);

    // Count votes for only the tied players
    Object.values(allVotes).flat().forEach(targetId => {
      if (tiedPlayerIds.has(targetId)) {
        tieBreakerVoteCounts[targetId]++;
      }
    });

    const sortedTiedPlayers = Object.entries(tieBreakerVoteCounts).sort(([, a], [, b]) => b - a);
    
    const alreadyEliminatedCount = gameState.eliminatedPlayers.length;
    const totalNeeded = gameState.impostorCount;
    const remainingToEliminate = totalNeeded - alreadyEliminatedCount;

    // If we don't have enough players to eliminate, or no one voted, end the round.
    if (sortedTiedPlayers.length < remainingToEliminate || sortedTiedPlayers.length === 0 || remainingToEliminate <= 0) {
      const playersToEliminate = sortedTiedPlayers.slice(0, remainingToEliminate).map(([id]) => id);
      const newEliminatedPlayers = [...gameState.eliminatedPlayers, ...playersToEliminate];
      const { winners, winnerType } = determineWinner(gameState, gameState.players, newEliminatedPlayers);

      setGameState(prev => ({
        ...prev,
        phase: 'voteResults',
        eliminatedPlayers: newEliminatedPlayers,
        votes: {},
        tieBreakerVotes: [...(prev.tieBreakerVotes || []), allVotes],
        winners,
        winnerType,
        isTieVote: false,
        tiedPlayers: [],
      }));
      setCurrentScreen('voteResults');
      return;
    }
    
    // Check for a tie at the elimination boundary
    const eliminationVoteCount = sortedTiedPlayers[remainingToEliminate - 1][1];
    const potentialTie = sortedTiedPlayers[remainingToEliminate]?.[1] === eliminationVoteCount;

    if (potentialTie) {
      console.log('Another tie detected in tie-breaker round.');
      
      const playersToEliminate = sortedTiedPlayers
        .filter(([, votes]) => votes > eliminationVoteCount)
        .map(([id]) => id);

      const playersInNewTie = sortedTiedPlayers
        .filter(([, votes]) => votes === eliminationVoteCount)
        .map(([id]) => id);
      
      setGameState(prev => ({
        ...prev,
        isTieVote: true,
        tiedPlayers: playersInNewTie,
        eliminatedPlayers: [...prev.eliminatedPlayers, ...playersToEliminate],
        votes: {}, // Clear votes for the next round
        tieBreakerVotes: [...(prev.tieBreakerVotes || []), allVotes],
      }));
      setCurrentScreen('voting');
      return;
    }

    const playersToEliminate = sortedTiedPlayers.slice(0, remainingToEliminate).map(([id]) => id);
    const newEliminatedPlayers = [...gameState.eliminatedPlayers, ...playersToEliminate];
    const { winners, winnerType } = determineWinner(gameState, gameState.players, newEliminatedPlayers);

    setGameState(prev => ({
      ...prev,
      phase: 'voteResults',
      eliminatedPlayers: newEliminatedPlayers,
      // previousEliminatedPlayers is already correctly set from when the tie was initiated
      votes: {},
      tieBreakerVotes: [...(prev.tieBreakerVotes || []), allVotes],
      winners,
      winnerType,
      isTieVote: false,
      tiedPlayers: [],
    }));
    setCurrentScreen('voteResults');
    return;
  }
  // --- END NEW LOGIC ---


  // Calculate vote counts - include ALL players, even those with 0 votes
  const voteCounts: { [key: string]: number } = {};
  
  // Initialize all non-eliminated players with 0 votes
  gameState.players.forEach(player => {
    if (!gameState.eliminatedPlayers.includes(player.id)) {
      voteCounts[player.id] = 0;
    }
  });
  
  // Count actual votes
  Object.entries(allVotes).forEach(([voterId, playerVotes]) => {
    console.log(`Voter ${voterId} voted for:`, playerVotes);
    playerVotes.forEach(targetId => {
      if (Object.prototype.hasOwnProperty.call(voteCounts, targetId)) {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      }
    });
  });

  console.log('All vote counts:', voteCounts);

  // Sort players by vote count (highest first)
  const sortedPlayers = Object.entries(voteCounts)
    .filter(([playerId]) => !gameState.eliminatedPlayers.includes(playerId))
    .sort(([, a], [, b]) => b - a);

  const impostorCount = gameState.impostorCount;
  
  console.log('VOTING RESULTS:', {
    allVotes: allVotes,
    voteCounts: voteCounts,
    sortedPlayers: sortedPlayers.map(([id, votes]) => ({ id, votes })),
    impostorCount,
    totalPlayers: sortedPlayers.length,
    eliminatedPlayers: gameState.eliminatedPlayers
  });

  // Check if we have enough players to eliminate
  if (sortedPlayers.length < impostorCount) {
    console.log('Not enough players to eliminate');
    return;
  }

  if (gameState.isRandomizeMode) {
    const wasTieBreakerRound = gameState.isTieVote;

    const highestVoteCount = sortedPlayers.length > 0 ? sortedPlayers[0][1] : 0;
    const playersWithHighestVotes = sortedPlayers.filter(([, votes]) => votes === highestVoteCount);

    if (playersWithHighestVotes.length > 1 && highestVoteCount > 0) {
      // STILL A TIE, or a new tie.
      setGameState(prev => {
        // If the round we just processed was a tie-breaker, its votes need to be stored.
        const newTieBreakerLog = wasTieBreakerRound 
          ? [...(prev.tieBreakerVotes || []), { ...allVotes }] 
          : prev.tieBreakerVotes;
        
        return {
          ...prev,
          phase: 'voting',
          isTieVote: true, // Set/keep as true for the next round
          tiedPlayers: playersWithHighestVotes.map(([playerId]) => playerId),
          votes: {}, // Clear for next round
          originalVotes: prev.originalVotes || { ...allVotes }, // Capture original votes on first tie
          tieBreakerVotes: newTieBreakerLog, // Update the log
        }
      });
      setCurrentScreen('voting');
    } else {
      // TIE RESOLVED or no tie in the first place.
      const eliminatedPlayerIds = highestVoteCount > 0 ? [playersWithHighestVotes[0][0]] : [];
      setGameState(prev => {
        const newEliminatedPlayers = [...prev.eliminatedPlayers, ...eliminatedPlayerIds];
        const updatedPlayers = prev.players.map(p => ({ ...p, isEliminated: newEliminatedPlayers.includes(p.id) }));

        // If the round we just processed was a tie-breaker, its votes need to be stored.
        const newTieBreakerLog = wasTieBreakerRound ? [...(prev.tieBreakerVotes || []), { ...allVotes }] : prev.tieBreakerVotes;

        return {
          ...prev,
          phase: 'voteResults',
          votes: allVotes,
          players: updatedPlayers,
          eliminatedPlayers: newEliminatedPlayers,
          previousEliminatedPlayers: prev.eliminatedPlayers,
          
          isTieVote: false, // Tie is resolved
          tiedPlayers: [],
          tieBreakerVotes: newTieBreakerLog,
          originalVotes: prev.originalVotes || allVotes,
        }
      });
      setCurrentScreen('voteResults');
    }
    return;
  }
  
  // Get the vote count of the N-th player (where N = impostor count)
  let nthPlayerVotes = -1;
  if (sortedPlayers.length > 0) {
    nthPlayerVotes = sortedPlayers[impostorCount - 1] ? sortedPlayers[impostorCount - 1][1] : -1;
  }
  
  console.log('TIE DETECTION:', {
    impostorCount,
    nthPlayerIndex: impostorCount - 1,
    nthPlayerVotes,
    sortedPlayers: sortedPlayers.map(([id, votes]) => ({ id, votes }))
  });
  
  // Find all players with the same vote count as the N-th position
  const playersWithNthVotes = sortedPlayers.filter(([, votes]) => votes === nthPlayerVotes);
  
  // Check if there are players OUTSIDE the top N with the same vote count as N-th position
  const playersInTopN = sortedPlayers.slice(0, impostorCount);
  const playersOutsideTopN = sortedPlayers.slice(impostorCount);
  
  const tiedPlayersOutsideTopN = playersOutsideTopN.filter(([, votes]) => votes === nthPlayerVotes);
  
  console.log('Players with Nth position votes:', playersWithNthVotes.map(([id, votes]) => ({ id, votes })));
  console.log('Players in top N:', playersInTopN.map(([id, votes]) => ({ id, votes })));
  console.log('Players outside top N:', playersOutsideTopN.map(([id, votes]) => ({ id, votes })));
  console.log('Tied players outside top N:', tiedPlayersOutsideTopN.map(([id, votes]) => ({ id, votes })));
    
  if (tiedPlayersOutsideTopN.length > 0) {
    console.log('TIE DETECTED - players outside top N have same votes as N-th position:', tiedPlayersOutsideTopN.map(([id, votes]) => ({ id, votes })));
    
    // CORRECT LOGIC: Eliminate players who are in top N positions (have >= Nth position votes and are in top N)
    const playersToEliminate = playersInTopN.filter(([, votes]) => votes > nthPlayerVotes);
    const alreadyEliminatedPlayers = playersToEliminate.map(([playerId]) => playerId);
    
    console.log('Players automatically eliminated (in top N with more votes):', alreadyEliminatedPlayers);
    console.log('Players in tie-breaker (all with Nth position votes):', playersWithNthVotes.map(([playerId]) => playerId));
    
    // Calculate how many players we need to eliminate total
    const totalEliminated = gameState.eliminatedPlayers.length + alreadyEliminatedPlayers.length;
    const remainingToEliminate = impostorCount - totalEliminated;
    
    console.log('Total eliminated so far:', totalEliminated, 'Remaining to eliminate:', remainingToEliminate);
    
    if (remainingToEliminate <= 0) {
      // We've already eliminated enough players, no need for tie-breaker
      console.log('Already eliminated enough players, no tie-breaker needed');
      const finalEliminatedPlayers = [...gameState.eliminatedPlayers, ...alreadyEliminatedPlayers];
      
      const { winners, winnerType } = determineWinner(gameState, gameState.players, finalEliminatedPlayers);
      
      if (winnerType) {
        console.log('Game ended! Winner type:', winnerType);
      setGameState({
        ...gameState,
        phase: 'results',
        votes: allVotes,
          eliminatedPlayers: finalEliminatedPlayers,
        winners,
          winnerType: winnerType || undefined,
        isTieVote: false,
        tiedPlayers: []
      });
      setCurrentScreen('results');
      return;
    }

      // Game continues
    setGameState({
      ...gameState,
      phase: 'voteResults',
      votes: allVotes,
        eliminatedPlayers: finalEliminatedPlayers,
      winners,
      winnerType,
        isTieVote: false,
        tiedPlayers: []
    });
    setCurrentScreen('voteResults');
      return;
    }
      
    // Update game state with automatically eliminated players
    const updatedGameState = {
        ...gameState,
      eliminatedPlayers: [...gameState.eliminatedPlayers, ...alreadyEliminatedPlayers],
      votes: allVotes
    };
    
    // Store original votes before starting tie-breaker
    const originalVotes = { ...allVotes };
    
    // Start tie-breaker vote for all players with Nth position votes - clear votes for new round
    setGameState({
      ...updatedGameState,
      phase: 'voting',
      isTieVote: true,
      tiedPlayers: playersWithNthVotes.map(([playerId]) => playerId),
      votes: {}, // Clear all votes for tie-breaker round
      originalVotes: originalVotes, // Store original votes
      previousEliminatedPlayers: gameState.eliminatedPlayers, // Capture state before ANY eliminations this round
    });
    setCurrentScreen('voting');
  } else {
    // No tie, eliminate top N players directly
    const eliminatedPlayerIds = sortedPlayers.slice(0, impostorCount).map(([playerId]) => playerId);
    
    console.log('NO TIE - eliminating top N players:', eliminatedPlayerIds);
    
    const { winners, winnerType } = determineWinner(gameState, gameState.players, eliminatedPlayerIds);
    
    // Check if game has ended
    if (winnerType) {
      console.log('Game ended! Winner type:', winnerType, winners.length > 0 ? `Winners: ${winners.map(w => w.username)}` : 'No winners (tie)');
      
      setGameState(prev => {
        const newEliminatedPlayers = [...prev.eliminatedPlayers, ...eliminatedPlayerIds];
        
        return {
          ...prev,
          phase: 'voteResults', // <-- CHANGE HERE
          votes: allVotes,
          originalVotes: allVotes, // Store original votes for vote breakdown
          eliminatedPlayers: newEliminatedPlayers,
          previousEliminatedPlayers: prev.eliminatedPlayers, // For highlighting this round's eliminated
          winners,
          winnerType: winnerType || undefined,
          isTieVote: false,
          tiedPlayers: []
        };
      });
      setCurrentScreen('voteResults'); // <-- CHANGE HERE
      return;
    }

    // Game continues - show vote results
    setGameState(prev => {
      const newEliminatedPlayers = [...prev.eliminatedPlayers, ...eliminatedPlayerIds];

      return {
        ...prev,
        phase: 'voteResults',
        votes: allVotes,
        originalVotes: allVotes, // Store original votes for vote breakdown
        eliminatedPlayers: newEliminatedPlayers,
        winners,
        winnerType,
        isTieVote: false,
        tiedPlayers: [],
        previousEliminatedPlayers: prev.eliminatedPlayers,
      };
    });
    setCurrentScreen('voteResults');
  }
};

// Import screens
import EnteringScreen from './components/EnteringScreen';
import HomeScreen from './components/HomeScreen';
import RoomModeScreen from './components/RoomModeScreen';
import GamePackScreen from './components/GamePackScreen';
import CustomQuestionScreen from './components/CustomQuestionScreen';
import JoinRoomScreen from './components/JoinRoomScreen';
import LobbyScreen from './components/LobbyScreen';
import QuestionScreen from './components/QuestionScreen';
import DiscussionScreen from './components/DiscussionScreen';
import VotingScreen from './components/VotingScreen';
import VoteResultsScreen from './components/VoteResultsScreen';
import ResultsScreen from './components/ResultsScreen';
import RoleRevealModal from './components/RoleRevealModal';
import AnswerDisplayScreen from './components/AnswerDisplayScreen';
import RoleConfirmationScreen from './components/RoleConfirmationScreen';

type Screen = 'entering' | 'home' | 'roomMode' | 'gamePack' | 'customQuestion' | 'customQuestionCreation' | 'customWordCreation' | 'joinRoom' | 'lobby' | 'questions' | 'answers' | 'roleReveal' | 'discussion' | 'voting' | 'voteResults' | 'results' | 'roleConfirmation';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('entering');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  
  const [gameState, setGameState] = useState<GameState>({
    phase: 'lobby',
    players: [],
    currentRound: 1,
    maxRounds: 3,
    impostorCount: 1,
    hasJester: false,
    isRandomizeMode: false,
    hostId: '',
    roomCode: '',
    gameMode: 'questions',
    currentQuestion: '',
    currentImpostorQuestion: '',
    currentWord: '',
    currentImpostorWord: '',
    playerAnswers: {},
    submittedAnswers: {},
    votes: {},
    eliminatedPlayers: [],
    winners: [],
    winnerType: undefined,
    playerRoles: {},
    selectedPack: null,
    startingPlayer: null,
    turnOrder: [],
    currentTurnPlayer: null,
    selectedQuestionPack: null,
    selectedPackType: null,
    jesterCluePlayers: [],
    isTieVote: false,
    tiedPlayers: [],
    gameEndReason: undefined,
    currentVoteResult: undefined
  });

  // Local storage for room state persistence - temporarily disabled to fix screen transition issues
  // const [roomState, setRoomState] = useLocalStorage('impasta_room_state', null);

  // Load room state from localStorage on component mount - disabled
  // useEffect(() => {
  //   if (roomState && typeof roomState === 'object' && 'roomCode' in roomState && currentScreen === 'entering') {
  //     setGameState(roomState as GameState);
  //     setCurrentScreen('lobby');
  //   }
  // }, [roomState, currentScreen]);

  // Save room state to localStorage whenever gameState changes - disabled
  // useEffect(() => {
  //   if (gameState.roomCode) {
  //     setRoomState(gameState as any);
  //   }
  // }, [gameState, setRoomState]);

  const handleEnter = () => {
    setCurrentScreen('home');
  };

  const handleGameModeSelect = (mode: GameMode) => {
    setGameState(prev => ({ ...prev, gameMode: mode }));
    setCurrentScreen('roomMode');
  };


  const handlePackSelect = (pack: GamePack | WordPack) => {
    // Check if it's a custom pack - route to creation screen
    if (pack === 'custom') {
      setCurrentScreen(gameState.gameMode === 'questions' ? 'customQuestionCreation' : 'customWordCreation');
      return;
    }

    const roomCode = generateRoomCode();
    const hostPlayer: Player = {
      id: Date.now().toString(),
      username: username,
      avatar: avatar,
      isHost: true,
      role: 'innocent', // Host is innocent for regular packs
      isConnected: true,
      answer: '',
      hasVoted: false,
      hasSubmittedAnswer: false,
      hasSeenRole: false,
      isEliminated: false
    };

          setGameState({
            ...gameState,
            phase: 'lobby',
            players: [hostPlayer],
      hostId: hostPlayer.id,
      roomCode: roomCode,
      selectedPack: pack,
            selectedPackType: pack,
      currentRound: 1,
      eliminatedPlayers: [],
      winners: [],
      winnerType: undefined,
      playerAnswers: {},
      submittedAnswers: {},
      votes: {},
      originalVotes: undefined, // Clear previous game's original votes
      tieBreakerVotes: undefined, // Clear previous game's tie-breaker votes
      playerRoles: {},
      jesterCluePlayers: [],
      isTieVote: false,
      tiedPlayers: [],
      gameEndReason: undefined,
      currentVoteResult: undefined,
      currentImpostorWord: '' // Clear previous game's custom word
    });
    
    setCurrentScreen('lobby');
  };

  const handleCustomQuestionSave = (innocentQuestion: string, impostorQuestion: string) => {
    const roomCode = generateRoomCode();
    const hostPlayer: Player = {
      id: Date.now().toString(),
      username: username,
      avatar: avatar,
      isHost: true,
      role: 'spectator', // Host is spectator for custom packs
      isConnected: true,
      answer: '',
      hasVoted: false,
      hasSubmittedAnswer: false,
      hasSeenRole: false,
      isEliminated: false
    };

        setGameState({
          ...gameState,
          phase: 'lobby',
          players: [hostPlayer],
      hostId: hostPlayer.id,
      roomCode: roomCode,
      selectedPack: 'custom',
      selectedPackType: 'custom',
      currentRound: 1,
      eliminatedPlayers: [],
      winners: [],
      winnerType: undefined,
      playerAnswers: {},
      submittedAnswers: {},
      votes: {},
      originalVotes: undefined,
      tieBreakerVotes: undefined,
      playerRoles: {},
      jesterCluePlayers: [],
      isTieVote: false,
      tiedPlayers: [],
      gameEndReason: undefined,
      currentVoteResult: undefined,
      // Store custom questions for this game only
      currentQuestion: innocentQuestion,
      currentImpostorQuestion: impostorQuestion,
      currentImpostorWord: ''
    });
    
    setCurrentScreen('lobby');
  };

  const handleCustomWordSave = (innocentWord: string, impostorWord: string) => {
    const roomCode = generateRoomCode();
    const hostPlayer: Player = {
      id: Date.now().toString(),
      username: username,
      avatar: avatar,
      isHost: true,
      role: 'spectator', // Host is spectator for custom packs
      isConnected: true,
      answer: '',
      hasVoted: false,
      hasSubmittedAnswer: false,
      hasSeenRole: false,
      isEliminated: false
    };

      setGameState({
        ...gameState,
        phase: 'lobby',
        players: [hostPlayer],
      hostId: hostPlayer.id,
      roomCode: roomCode,
      selectedPack: 'custom',
      selectedPackType: 'custom',
      currentRound: 1,
      eliminatedPlayers: [],
      winners: [],
      winnerType: undefined,
      playerAnswers: {},
      submittedAnswers: {},
      votes: {},
      originalVotes: undefined,
      tieBreakerVotes: undefined,
      playerRoles: {},
      jesterCluePlayers: [],
      isTieVote: false,
      tiedPlayers: [],
      gameEndReason: undefined,
      currentVoteResult: undefined,
      // Store custom words for this game only
      currentWord: innocentWord,
      currentImpostorWord: impostorWord
    });
    
    setCurrentScreen('lobby');
  };

  const handleCustomCreationBack = () => {
    setCurrentScreen('gamePack');
  };

  const handleCustomContent = (data: { innocentQuestion?: string; impostorQuestion?: string; playerWord?: string }) => {
    const roomCode = generateRoomCode();
    const hostPlayer: Player = {
      id: Date.now().toString(),
      username: username,
      avatar: avatar,
      isHost: true,
      role: 'innocent',
      isConnected: true,
      answer: '',
      hasVoted: false,
      hasSubmittedAnswer: false,
      hasSeenRole: false,
      isEliminated: false
    };

    setGameState({
      ...gameState,
      phase: 'lobby',
        players: [hostPlayer],
      hostId: hostPlayer.id,
      roomCode: roomCode,
      selectedPack: 'custom',
      selectedPackType: 'custom',
      currentRound: 1,
      eliminatedPlayers: [],
      winners: [],
      winnerType: undefined,
      playerAnswers: {},
      submittedAnswers: {},
      votes: {},
      originalVotes: undefined, // Clear previous game's original votes
      tieBreakerVotes: undefined, // Clear previous game's tie-breaker votes
      playerRoles: {},
      jesterCluePlayers: [],
      isTieVote: false,
      tiedPlayers: [],
      gameEndReason: undefined,
      currentVoteResult: undefined,
      // Store custom content
      currentQuestion: data.innocentQuestion || '',
      currentImpostorQuestion: data.impostorQuestion || '',
      currentWord: data.playerWord || ''
    });
    
    setCurrentScreen('lobby');
  };

  const handleJoinRoomSubmit = (roomCode: string) => {
    // For now, just create a mock room for testing
    // In a real app, this would validate the room code and join the existing room
    const newPlayer: Player = {
      id: Date.now().toString(),
      username: username,
      avatar: avatar,
      isHost: false,
      role: 'innocent',
      isConnected: true,
      answer: '',
      hasVoted: false,
      hasSubmittedAnswer: false,
      hasSeenRole: false,
      isEliminated: false
    };

    setGameState(prev => ({
      ...prev,
      players: [...prev.players, newPlayer],
      roomCode: roomCode
    }));
    
    setCurrentScreen('lobby');
  };

  const handleAddBot = () => {
    const bot = createBot(gameState.players.length);
    setGameState(prev => ({
      ...prev,
      players: [...prev.players, bot]
    }));
  };


  const handleImpostorCountChange = (count: number) => {
    setGameState(prev => ({ ...prev, impostorCount: count }));
  };

  const handleRandomizeToggle = (enabled: boolean) => {
    setGameState(prev => ({ ...prev, isRandomizeMode: enabled }));
  };

  const handleJesterToggle = (enabled: boolean) => {
    setGameState(prev => ({ ...prev, hasJester: enabled }));
  };

  const handleStartGame = () => {
    console.log('handleStartGame called, players:', gameState.players.length);
    if (gameState.players.length < 3) {
      alert('Need at least 3 players to start the game');
      return;
    }
    
    // Mark that we've played at least once
    setHasPlayedOnce(true);
    
    const playingPlayers = gameState.selectedPackType === 'custom' 
    ? gameState.players.filter(p => p.role !== 'spectator')
    : gameState.players;

    let finalImpostorCount = gameState.impostorCount;
    if (gameState.isRandomizeMode) {
      const randomCount = getRandomImpostorCount(playingPlayers.length);
      finalImpostorCount = Math.min(randomCount, 3);
    }
    // Assign roles
    const roleAssignments = assignRoles(gameState.players, finalImpostorCount, gameState.hasJester);
    
    // Generate content based on selected pack
    let question = '';
    let impostorQuestion = '';
    let word = '';

    if (gameState.gameMode === 'questions') {
      if (gameState.selectedPackType === 'custom') {
        question = gameState.currentQuestion;
        impostorQuestion = gameState.currentImpostorQuestion;
      } else {
        question = getRandomQuestion(gameState.selectedPack as string);
        impostorQuestion = getRandomImpostorQuestion(gameState.selectedPack as string);
      }
    } else {
      if (gameState.selectedPackType === 'custom') {
        word = gameState.currentWord;
      } else {
        word = getRandomWord(gameState.selectedPack as WordPack);
      }
    }

    let impostorWord = '';
    if (gameState.gameMode === 'words') {
      if (gameState.selectedPackType === 'custom') {
        impostorWord = gameState.currentImpostorWord;
      } else {
        impostorWord = getRandomWord(gameState.selectedPack as WordPack);
      }
    }

    // Create player roles mapping
    const playerRoles: Record<string, PlayerRole> = {};
    
    console.log('ROLE ASSIGNMENT DEBUG:', {
      allPlayers: gameState.players.map(p => ({ id: p.id, username: p.username, role: p.role, isBot: p.isBot })),
      roleAssignments: roleAssignments,
      impostorCount: finalImpostorCount
    });
    
    // Apply roles to ALL players (assignRoles returns roles for all players)
    gameState.players.forEach((player, index) => {
      playerRoles[player.id] = roleAssignments[index];
      console.log(`Assigned ${roleAssignments[index]} to ${player.username} (${player.id})`);
    });

    // Generate jester clues if jester is enabled
    const jesterCluePlayers = gameState.hasJester ? generateJesterClues(gameState.players, playerRoles, gameState.hasJester) : [];

        setGameState(prev => ({
          ...prev,
      phase: 'questions',
      impostorCount: finalImpostorCount,
      currentQuestion: question,
      currentImpostorQuestion: impostorQuestion,
      currentWord: word,
      currentImpostorWord: impostorWord,
      playerRoles,
      jesterCluePlayers,
      currentRound: 1,
      playerAnswers: {},
      submittedAnswers: {},
      votes: {},
      eliminatedPlayers: [],
      winners: [],
      winnerType: undefined,
      isTieVote: false,
      tiedPlayers: [],
      gameEndReason: undefined,
      currentVoteResult: undefined
    }));

      // Check if current user is a spectator (host in custom packs)
      const currentPlayer = gameState.players.find(p => p.username === username);
      if (currentPlayer?.role === 'spectator') {
        console.log('Host is spectator, going to answers screen to wait for players');
        setCurrentScreen('answers');
      } else {
        console.log('Setting screen to questions');
        setCurrentScreen('questions');
      }
  };

  const handleAnswerSubmit = (answer: string) => {
    const currentPlayer = gameState.players.find(p => p.username === username);
    if (!currentPlayer) return;

    const updatedGameState = {
      ...gameState,
      playerAnswers: {
      ...gameState.playerAnswers,
      [currentPlayer.id]: answer
      },
      submittedAnswers: {
      ...gameState.submittedAnswers,
      [currentPlayer.id]: true
      }
    };

    setGameState(updatedGameState);

    // Check if all players have submitted their answers
    const allPlayersSubmitted = gameState.players.every(player => 
      updatedGameState.submittedAnswers[player.id] || player.isBot
    );

    if (allPlayersSubmitted) {
      console.log('All players submitted answers, generating bot answers and showing role reveal');
      
      // Generate bot answers for bots that haven't answered yet
      const botAnswers: Record<string, string> = {};
      const botSubmissions: Record<string, boolean> = {};

    gameState.players.forEach(player => {
        if (player.isBot && !updatedGameState.submittedAnswers[player.id]) {
          const answer = generateBotAnswer();
          botAnswers[player.id] = answer;
          botSubmissions[player.id] = true;
        }
      });

      // Update with bot answers
      const finalGameState = {
        ...updatedGameState,
        playerAnswers: { ...updatedGameState.playerAnswers, ...botAnswers },
        submittedAnswers: { ...updatedGameState.submittedAnswers, ...botSubmissions }
      };

      setGameState(finalGameState);

      // Show role reveal first, then go to answer display
      console.log('Transitioning to role reveal screen');
        setCurrentScreen('roleReveal');
    }
  };

  const handleForceSubmitAllAnswers = useCallback(() => {
    // Generate bot answers for all bots that haven't answered
    const botAnswers: Record<string, string> = {};
    const botSubmissions: Record<string, boolean> = {};
    
    gameState.players.forEach(player => {
      if (player.isBot && !gameState.submittedAnswers[player.id]) {
        const answer = generateBotAnswer();
        botAnswers[player.id] = answer;
        botSubmissions[player.id] = true;
      }
    });

      setGameState(prev => ({
        ...prev,
      playerAnswers: { ...prev.playerAnswers, ...botAnswers },
      submittedAnswers: { ...prev.submittedAnswers, ...botSubmissions }
      }));
  }, [gameState.players, gameState.submittedAnswers]);

  const handleAllAnswersSubmitted = () => {
    // This function is no longer used since we go directly to voting screen
    console.log('All answers submitted - this function is deprecated');
  };

  const handleStartVoting = () => {
    setCurrentScreen('voting');
  };

  const handleBotVote = (botId: string, votes: string[]) => {
    const botPlayer = gameState.players.find(p => p.id === botId);
    console.log(`Bot ${botPlayer?.username || botId} voting for ${votes.join(', ')}`);
    console.log('Current votes before bot vote:', gameState.votes);
    setGameState(prev => {
      const newVotes = {
        ...prev.votes,
        [botId]: votes
      };
      console.log('New votes after bot vote:', newVotes);
      return {
        ...prev,
        votes: newVotes
      };
    });
  };


  const handleForceSubmitBotVotes = useCallback(() => {
    console.log('FORCE SUBMIT BOT VOTES ONLY - Only forcing bots to vote...');
    
    const nonEliminatedPlayers = gameState.players.filter(p => !p.isEliminated);
    const botVotes: Record<string, string[]> = {};
    
    nonEliminatedPlayers.forEach(player => {
      if (player.isBot && !gameState.votes[player.id] && 
          (gameState.selectedPackType !== 'custom' || player.role !== 'spectator')) {
        const votesNeeded = gameState.isRandomizeMode || gameState.isTieVote ? 1 : (gameState.impostorCount - gameState.eliminatedPlayers.length);
        const tiedPlayers = gameState.isTieVote ? gameState.tiedPlayers : undefined;
        
        const votes = generateBotVotes(
          player.id,
          nonEliminatedPlayers,
          votesNeeded,
          player.personality || 'random',
          tiedPlayers
        );
        botVotes[player.id] = votes;
        console.log(`Force submit bot votes - Bot ${player.username} voting:`, votes);
      }
    });
    
    console.log('Force submit bot votes - Generated votes:', botVotes);
          
          setGameState(prev => ({
            ...prev,
      votes: { ...prev.votes, ...botVotes }
    }));
  }, [gameState.players, gameState.votes, gameState.isTieVote, gameState.tiedPlayers, gameState.impostorCount, gameState.eliminatedPlayers, gameState.isRandomizeMode]);

  const handleSubmitVotes = () => {
      const currentPlayer = gameState.players.find(p => p.username === username);
    if (!currentPlayer) return;

    // Generate bot votes for all bots that haven't voted
    const nonEliminatedPlayers = gameState.players.filter(p => !p.isEliminated);
    const botVotes: Record<string, string[]> = {};
        
    nonEliminatedPlayers.forEach(player => {
      if (player.isBot && !gameState.votes[player.id] && 
          (gameState.selectedPackType !== 'custom' || player.role !== 'spectator')) {
          const votesNeeded = gameState.isRandomizeMode || gameState.isTieVote ? 1 : (gameState.impostorCount - gameState.eliminatedPlayers.length);
          const tiedPlayers = gameState.isTieVote ? gameState.tiedPlayers : undefined;
        
        const votes = generateBotVotes(
          player.id,
          nonEliminatedPlayers,
          votesNeeded,
          player.personality || 'random',
          tiedPlayers
        );
        botVotes[player.id] = votes;
      }
    });

          const allVotes = { ...gameState.votes, ...botVotes };
          
    // VALIDATION: Ensure all NON-SPECTATOR players have voted before processing results
    const allPlayers = nonEliminatedPlayers;
    const nonSpectatorPlayers = allPlayers.filter(p => 
      gameState.selectedPackType !== 'custom' || p.role !== 'spectator'
    );
    const playersWhoVoted = Object.keys(allVotes);
    const playersWhoHaventVoted = nonSpectatorPlayers.filter(p => !playersWhoVoted.includes(p.id));
    
    console.log('VOTING VALIDATION:', {
      totalPlayers: allPlayers.length,
      nonSpectatorPlayers: nonSpectatorPlayers.length,
      playersWhoVoted: playersWhoVoted.length,
      playersWhoHaventVoted: playersWhoHaventVoted.map(p => ({ id: p.id, username: p.username, isBot: p.isBot, role: p.role })),
      allVotes: Object.keys(allVotes)
    });
    
    if (playersWhoHaventVoted.length > 0) {
      console.error('ERROR: Some players haven\'t voted yet!', playersWhoHaventVoted);
      // Don't process results until all players have voted
        return;
      }
      
    // Process voting results
    processVotingResults(allVotes, gameState, setGameState, (screen: string) => setCurrentScreen(screen as Screen), determineWinner);
  };

  const handleStartTieBreaker = () => {
    setCurrentScreen('voting');
  };

  const handleContinueRandomize = () => {
    setGameState(prev => ({
      ...prev,
      phase: 'questions', // Reset to discussion phase
      votes: {}, // Clear votes for the new round
      isTieVote: false,
      tiedPlayers: [],
      originalVotes: undefined, // Clear vote history for the new round
      tieBreakerVotes: undefined,
    }));
    setCurrentScreen('answers');
  };

  const handleFinishRandomize = () => {
    const { winners, winnerType } = determineWinner(gameState, gameState.players, gameState.eliminatedPlayers);
    setGameState(prev => ({
      ...prev,
      phase: 'results',
      winners,
      winnerType
    }));
    setCurrentScreen('results');
  };

  const handlePlayAgain = () => {
    // For custom packs, check if we've played once before
    if (gameState.selectedPackType === 'custom') {
      if (hasPlayedOnce) {
        // After playing once, go back to creation screen to create new questions
        setCurrentScreen(gameState.gameMode === 'questions' ? 'customQuestionCreation' : 'customWordCreation');
        return;
      } else {
        // First time playing, stay in lobby with same players but reset game settings
        setGameState(prev => ({
          ...prev,
          phase: 'lobby',
          currentRound: 1,
          eliminatedPlayers: [],
          winners: [],
          winnerType: undefined,
          playerAnswers: {},
          submittedAnswers: {},
          votes: {},
          originalVotes: undefined, // Clear previous game's original votes
          tieBreakerVotes: undefined, // Clear previous game's tie-breaker votes
          playerRoles: {},
          jesterCluePlayers: [],
          isTieVote: false,
          tiedPlayers: [],
          gameEndReason: undefined,
          currentVoteResult: undefined,
          // Reset game settings to defaults
          impostorCount: 1,
          hasJester: false,
          isRandomizeMode: false,
          // Keep custom content and players
          currentImpostorWord: '' // Clear previous game's custom word
        }));
        setCurrentScreen('lobby');
        return;
      }
    }
      
    // For regular packs, go back to lobby with same pack and reset settings
    setGameState(prev => {
      // Reset isEliminated status for all players
      const resetPlayers = prev.players.map(p => ({ ...p, isEliminated: false }));

      return {
        ...prev,
        players: resetPlayers,
        phase: 'lobby',
        currentRound: 1,
        eliminatedPlayers: [],
        winners: [],
        winnerType: undefined,
        playerAnswers: {},
        submittedAnswers: {},
        votes: {},
        originalVotes: undefined, // Clear previous game's original votes
        tieBreakerVotes: undefined, // Clear previous game's tie-breaker votes
        playerRoles: {},
        jesterCluePlayers: [],
        isTieVote: false,
        tiedPlayers: [],
        gameEndReason: undefined,
        currentVoteResult: undefined,
        // Reset game settings to defaults
        impostorCount: 1,
        hasJester: false,
        isRandomizeMode: false,
        currentImpostorWord: '' // Clear previous game's custom word
      };
    });
    setCurrentScreen('lobby');
  };

  const handleBackToHome = () => {
    setGameState({
      phase: 'lobby',
      players: [],
      currentRound: 1,
      maxRounds: 3,
      impostorCount: 1,
      hasJester: false,
      isRandomizeMode: false,
      hostId: '',
      roomCode: '',
      gameMode: 'questions',
      currentQuestion: '',
      currentImpostorQuestion: '',
      currentWord: '',
      currentImpostorWord: '',
      playerAnswers: {},
      submittedAnswers: {},
      votes: {},
      originalVotes: undefined, // Clear previous game's original votes
      tieBreakerVotes: undefined, // Clear previous game's tie-breaker votes
      eliminatedPlayers: [],
      winners: [],
      winnerType: undefined,
      playerRoles: {},
      selectedPack: null,
      startingPlayer: null,
      turnOrder: [],
      currentTurnPlayer: null,
      selectedQuestionPack: null,
      selectedPackType: null,
      jesterCluePlayers: [],
      isTieVote: false,
      tiedPlayers: [],
      gameEndReason: undefined,
      currentVoteResult: undefined
    });
    setHasPlayedOnce(false); // Reset play state when going back to home
    setCurrentScreen('home');
  };


  const handleRoleConfirmed = () => {
    // After role reveal, go to answers screen for consistent design
    console.log('Role confirmed, transitioning to answers screen');
    setCurrentScreen('answers');
  };

  // Auto-submit answers when timer expires
  useEffect(() => {
    if (currentScreen === 'questions' && gameState.phase === 'questions') {
      const timer = setTimeout(() => {
        handleForceSubmitAllAnswers();
        handleAllAnswersSubmitted();
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [currentScreen, gameState.phase, handleForceSubmitAllAnswers]);

  // Auto-submit votes when timer expires OR when all players have voted
  useEffect(() => {
    if ((currentScreen === 'voting' && gameState.phase === 'voting') || 
        (currentScreen === 'answers' && gameState.phase === 'voting')) {
      // Check if all non-spectator, non-eliminated players have voted
      const allPlayers = gameState.players;
      const activePlayers = allPlayers.filter(p => !p.isEliminated);
      const nonSpectatorPlayers = activePlayers.filter(p => 
        gameState.selectedPackType !== 'custom' || p.role !== 'spectator'
      );
      const playersWhoVoted = Object.keys(gameState.votes);
      const humanPlayer = allPlayers.find(p => p.username === username);
      const humanPlayerIsSpectator = humanPlayer?.role === 'spectator' && gameState.selectedPackType === 'custom';
      const humanPlayerHasVoted = humanPlayer ? playersWhoVoted.includes(humanPlayer.id) : false;
      const allNonSpectatorPlayersHaveVoted = nonSpectatorPlayers.every(p => playersWhoVoted.includes(p.id));
      
      console.log('VOTE CHECK:', {
        totalPlayers: allPlayers.length,
        activePlayers: activePlayers.length,
        nonSpectatorPlayers: nonSpectatorPlayers.length,
        playersWhoVoted: playersWhoVoted.length,
        allNonSpectatorPlayersHaveVoted,
        humanPlayerIsSpectator,
        humanPlayerHasVoted,
        humanPlayer: humanPlayer ? { id: humanPlayer.id, username: humanPlayer.username, role: humanPlayer.role } : 'not found',
        nonSpectatorPlayersList: nonSpectatorPlayers.map(p => ({ id: p.id, username: p.username, hasVoted: playersWhoVoted.includes(p.id), isHuman: p.username === username }))
      });
      
      // Process results if all non-spectator players have voted
      if (allNonSpectatorPlayersHaveVoted && nonSpectatorPlayers.length > 0) {
        if (humanPlayerIsSpectator) {
          // Human player is spectator, process results immediately
          console.log('All non-spectator players have voted, processing results (human is spectator)...');
          handleSubmitVotes();
          return;
        } else if (humanPlayerHasVoted) {
          // Human player is not spectator and has voted, process results
          console.log('All players have voted (including human), processing results immediately...');
          handleSubmitVotes();
          return;
        } else {
          // Human player is not spectator but hasn't voted yet
          console.log('All non-spectator players have voted, waiting for human player to vote...');
        }
      } else if (gameState.isTieVote) {
        console.log('Tie-breaker active - waiting for all players to vote again...');
      }
      
      // Force bots to vote after 3 seconds, but don't force human players
      const timer = setTimeout(() => {
        console.log('Bot voting timer expired, force submitting bot votes only...');
        handleForceSubmitBotVotes();
      }, 3000); // 3 seconds - only for bots

      return () => clearTimeout(timer);
    }
  }, [currentScreen, gameState.phase, gameState.players.length, gameState.votes, gameState.eliminatedPlayers.length, username]);

  // Auto-vote for bots in voting screen - DISABLED to prevent conflicts with VotingScreen logic
  // useEffect(() => {
  //   if (currentScreen === 'voting' && gameState.phase === 'voting') {
  //     const timer = setTimeout(() => {
  //       gameState.players.forEach(player => {
  //         if (player.isBot && !gameState.votes[player.id]) {
  //           const votesNeeded = gameState.isTieVote ? 1 : gameState.impostorCount;
  //           const tiedPlayers = gameState.isTieVote ? gameState.tiedPlayers : undefined;
  //           
  //           const votes = generateBotVotes(
  //             player.id,
  //             gameState.players,
  //             votesNeeded,
  //             player.personality || 'random',
  //             tiedPlayers
  //           );
  //           handleBotVote(player.id, votes);
  //         }
  //       });
  //     }, 1000); // 1 second delay

  //     return () => clearTimeout(timer);
  //   }
  // }, [currentScreen, gameState.phase, gameState.players, gameState.votes, gameState.eliminatedPlayers, gameState.playerRoles, gameState.isTieVote, gameState.tiedPlayers]);

  // Auto-submit bot answers immediately when questions phase starts or when on answers screen
  useEffect(() => {
    if ((currentScreen === 'questions' && gameState.phase === 'questions') || 
        (currentScreen === 'answers' && gameState.phase === 'questions')) {
      const bots = gameState.players.filter(p => p.isBot && !gameState.submittedAnswers[p.id]);
      
      if (bots.length > 0) {
        console.log('Auto-submitting answers for bots:', bots.map(b => b.username));
        
        const botAnswers: Record<string, string> = {};
        const botSubmissions: Record<string, boolean> = {};
        
        bots.forEach(bot => {
          const answer = generateBotAnswer();
          botAnswers[bot.id] = answer;
          botSubmissions[bot.id] = true;
          console.log(`Bot ${bot.username} answered: ${answer}`);
        });
        
      setGameState(prev => ({
        ...prev,
          playerAnswers: { ...prev.playerAnswers, ...botAnswers },
          submittedAnswers: { ...prev.submittedAnswers, ...botSubmissions }
        }));
      }
    }
  }, [currentScreen, gameState.phase, gameState.players.length, gameState.submittedAnswers]);

  // Handle navigation to voting screen for host spectators (now handled within AnswerDisplayScreen)
  useEffect(() => {
    const handleNavigateToVoting = () => {
      console.log('Voting phase started within AnswerDisplayScreen');
      // The voting is now handled within the AnswerDisplayScreen component
      // No need to change screens
    };

    window.addEventListener('navigateToVoting', handleNavigateToVoting);
    return () => window.removeEventListener('navigateToVoting', handleNavigateToVoting);
  }, []);

  // Auto-adjust game settings when player count changes or when entering lobby
  useEffect(() => {
    if (currentScreen === 'lobby' && gameState.phase === 'lobby') {
      const playingPlayers = gameState.selectedPackType === 'custom' 
        ? gameState.players.filter(p => p.role !== 'spectator')
        : gameState.players;
      
      const playerCount = playingPlayers.length;
      
      // Calculate maximum allowed impostors for current player count
      const maxImpostors = Math.max(1, Math.floor((playerCount - 1) / 2));
      
      // If current impostor count is too high for player count, reset to 1
      if (gameState.impostorCount > maxImpostors) {
        console.log(`Player count reduced to ${playerCount}, resetting impostor count from ${gameState.impostorCount} to 1`);
        setGameState(prev => ({
          ...prev,
          impostorCount: 1,
          hasJester: false,
          isRandomizeMode: false
        }));
      }
      
      // If player count is less than 5, disable jester and randomize
      if (playerCount < 5) {
        if (gameState.hasJester || gameState.isRandomizeMode) {
          console.log(`Player count reduced to ${playerCount}, disabling jester and randomize`);
          setGameState(prev => ({
            ...prev,
            hasJester: false,
            isRandomizeMode: false
          }));
        }
      }
    }
  }, [currentScreen, gameState.phase, gameState.players.length, gameState.selectedPackType, gameState.impostorCount, gameState.hasJester, gameState.isRandomizeMode]);

  const renderScreen = () => {
    console.log('renderScreen called, currentScreen:', currentScreen);
    switch (currentScreen) {
      case 'entering':
        return <EnteringScreen onEnter={handleEnter} />;
      case 'home':
        return (
          <HomeScreen
            onGameModeSelect={handleGameModeSelect}
            username={username}
            onUsernameChange={setUsername}
            avatar={avatar}
            onAvatarChange={setAvatar}
            language="en"
            onLanguageChange={() => {}}
          />
        );
      case 'roomMode':
        return (
          <RoomModeScreen
            onCreateRoom={() => setCurrentScreen('gamePack')}
            onJoinRoom={() => setCurrentScreen('joinRoom')}
            onBack={() => setCurrentScreen('home')}
            language="en"
          />
        );
      case 'gamePack':
        return (
          <GamePackScreen
            gameMode={gameState.gameMode}
            onPackSelect={handlePackSelect}
            onBack={() => setCurrentScreen('roomMode')}
            language="en"
          />
        );
      case 'customQuestionCreation':
        return (
          <CustomQuestionCreationScreen
            onSave={handleCustomQuestionSave}
            onBack={handleCustomCreationBack}
            language="en"
          />
        );
      case 'customWordCreation':
        return (
          <CustomWordCreationScreen
            onSave={handleCustomWordSave}
            onBack={handleCustomCreationBack}
            language="en"
          />
        );
      case 'customQuestion':
        return (
          <CustomQuestionScreen
            gameMode={gameState.gameMode}
            onSave={handleCustomContent}
            onBack={() => setCurrentScreen('gamePack')}
            language="en"
          />
        );
      case 'joinRoom':
        return (
          <JoinRoomScreen
            onJoinRoom={handleJoinRoomSubmit}
            onBack={() => setCurrentScreen('home')}
            error=""
            language="en"
          />
        );
      case 'lobby':
        return (
          <LobbyScreen
            gameState={gameState}
            currentUsername={username}
            onAddBot={handleAddBot}
            onImpostorCountChange={handleImpostorCountChange}
            onRandomizeToggle={handleRandomizeToggle}
            onJesterToggle={handleJesterToggle}
            onStartGame={handleStartGame}
            onBack={handleBackToHome}
            language="en"
          />
        );
      case 'questions':
        return (
          <QuestionScreen
            gameState={gameState}
            currentUsername={username}
            onSubmitAnswer={handleAnswerSubmit}
            language="en"
          />
        );
      case 'answers':
          return (
            <AnswerDisplayScreen
              gameState={gameState}
              currentUsername={username}
            language="en"
            onStartVoting={() => {
              // Update game phase to voting
              setGameState(prev => ({
                ...prev,
                phase: 'voting'
              }));
            }}
            onVote={(votes) => {
              // Store the human player's vote and then process all votes
              const currentPlayer = gameState.players.find(p => p.username === username);
              if (currentPlayer) {
                setGameState(prev => ({
                  ...prev,
                  votes: { ...prev.votes, [currentPlayer.id]: votes }
                }));
                
                // Process voting results
                setTimeout(() => {
                  handleSubmitVotes();
                }, 100);
              }
            }}
            setGameState={setGameState}
          />
        );
      case 'roleReveal':
        return (
          <>
            {/* Show AnswerDisplayScreen as background */}
            <AnswerDisplayScreen
              gameState={gameState}
              currentUsername={username}
              language="en"
              onStartVoting={() => {
                // Update game phase to voting
                setGameState(prev => ({
                  ...prev,
                  phase: 'voting'
                }));
              }}
              onVote={(votes) => {
                // Store the human player's vote and then process all votes
                const currentPlayer = gameState.players.find(p => p.username === username);
                if (currentPlayer) {
                  setGameState(prev => ({
                    ...prev,
                    votes: { ...prev.votes, [currentPlayer.id]: votes }
                  }));
                  
                  // Process voting results
                  /*setTimeout(() => {
                    handleSubmitVotes();
                  }, 100);*/
                }
              }}
              setGameState={setGameState}
            />
            {/* Show RoleRevealModal as overlay */}
            <RoleRevealModal
              playerRole={gameState.playerRoles[gameState.players.find(p => p.username === username)?.id || ''] as 'innocent' | 'impostor' | 'jester' || 'innocent'}
              playerName={username}
              onClose={handleRoleConfirmed}
              isOpen={true}
              language="en"
              players={gameState.players}
              playerAnswers={gameState.playerAnswers}
              currentQuestion={gameState.currentQuestion}
              currentWord={gameState.currentWord}
              gameMode={gameState.gameMode}
            />
          </>
        );
      case 'discussion':
        return (
          <DiscussionScreen
            gameState={gameState}
            currentUsername={username}
            onProceedToVoting={handleStartVoting}
            onUpdateGameState={setGameState}
            language="en"
          />
        );
      case 'voting':
        return (
          <VotingScreen
            gameState={gameState}
            currentUsername={username}
            onVote={(votes) => {
              // Store the human player's vote and then process all votes
        const currentPlayer = gameState.players.find(p => p.username === username);
              if (currentPlayer) {
                setGameState(prev => ({
                  ...prev,
                  votes: { ...prev.votes, [currentPlayer.id]: votes }
                }));
                // Process votes immediately - the useEffect will handle the timing
                // handleSubmitVotes();
              }
            }}
            onBotVote={handleBotVote}
            onStartVoting={() => {
              console.log('Voting started by host');
              // Voting starts automatically in VotingScreen component
            }}
          />
        );
      case 'voteResults':
        return (
          <VoteResultsScreen
            gameState={gameState}
            currentUsername={username}
            onStartTieBreaker={handleStartTieBreaker}
            onContinueGame={() => setCurrentScreen('questions')}
            onFinishGame={() => setCurrentScreen('results')}
            onContinueRandomize={handleContinueRandomize}
            onFinishRandomize={handleFinishRandomize}
            language="en"
          />
        );
      case 'results':
        return (
          <ResultsScreen
            gameState={gameState}
            onPlayAgain={handlePlayAgain}
            onBackToHome={handleBackToHome}
            language="en"
          />
        );
      case 'roleConfirmation':
        return (
          <RoleConfirmationScreen
            gameState={gameState}
            currentUsername={username}
            onProceedToDiscussion={handleRoleConfirmed}
            language="en"
          />
        );
      default:
        return <EnteringScreen onEnter={handleEnter} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {renderScreen()}
    </div>
  );
}

export default App;