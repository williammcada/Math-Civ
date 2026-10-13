export type Resource = 'food'|'currency'|'materials'|'authority';
export type Resources = Record<Resource,number>;
export type Mode='guided'|'campaign'|'scholar';
export type Side='east'|'west';
export type Result='victory'|'draw'|'defeat'|'orderly_withdrawal'|'disordered_withdrawal';
export type Phase='prologue'|'chronicle'|'council'|'policy'|'orders'|'administration'|'crisis'|'world'|'chapter_report'|'convoy_briefing'|'convoy_result'|'battle_review'|'battle_provision'|'battle_warchest'|'battle_deployment'|'battle_round'|'battle_result'|'ending'|'campaign_report';
export type Answer=Record<string,number|string>;
export type Path='attempt1'|'attempt2'|'attempt3'|'adviser'|'proceedEstimate'|'abandon';
export interface Point {x:number;y:number}
export interface Formation extends Point {id:string;side:Side;archetype:'cavalry'|'spears'|'arquebus';troops:number;baseTroops:number;startTroops:number;morale:number;equipmentPoints:number;commanderRating:number;move:number;range:number;ap:number;attacked:boolean;brace:boolean;forced:boolean;routed:boolean;exited:boolean;shattered:boolean;auxiliary:boolean;pendingReserve?:boolean;defended?:boolean;retaliationRound?:number;suppressionUntilActivation?:number;activations?:number;engineer?:boolean;auxiliaryRounds?:number}
export interface Event {type:string;key:string;chapter:number;before?:number;delta?:number;after?:number;detail?:Record<string,unknown>}
export interface Challenge {id:string;templateId:string;variantId:string;operands:Record<string,unknown>;answer:Answer;fields:string[];attempts:number;floor:number;submitted:Answer[];uncheckedAnswer?:Answer;answerPolicy?:'exact'|'rounding_up';hints:number;adviserShown:boolean;paid:Partial<Resources>;context:'order'|'crisis'|'provision'|'warchest';orderId:string;resolved:boolean;openedAt:number;firstSubmittedAt:number|null}
export interface RecordChallenge {answerPolicy?:'exact'|'rounding_up';id:string;templateId:string;variantId:string;operands:Record<string,unknown>;skillTags:string[];path:Path;masteryPoints:number;effectPerThousand:number;answer:Answer;entered:Answer[];hints:number;attempts:number;chapter:number;firstSubmissionMs:number;totalMs:number}
export interface Crisis {id:string;chapter:number;pressure:number;chance:number;roll:number;weights:Record<string,number>;severity:number;response:'full'|'partial'|'accept'|null;quality:number;resolved:boolean;unresolved:boolean;cost:Partial<Resources>;harm:Record<string,number>}
export type TacticalPlan='standard'|'flanking'|'engineer'|'fire_discipline';
export type ReserveEntry='north'|'south';
export interface Intent {unitId:string;goal:string;action:BattleAction;round:number;reason?:string}
export interface Battle {rulesVersion:2;scenarioId:'sekigahara'|'convoy';quota:Record<Side,number>;currentSupply:Record<Side,boolean>;rallies:Record<Side,{uses:number;lastRound:number}>;resupplied:Record<Side,boolean>;campChecks:Record<Side,number>;councilPending:boolean;reviewSeen:boolean;finalized:boolean;outcomeReason:string;plans:Record<Side,TacticalPlan>;reserveEntries:Record<Side,ReserveEntry>;planLocked:boolean;pontoonUsed:Record<Side,boolean>;intents:Record<string,Intent>;wagon?:Point&{integrity:number;delivered:boolean};convoySnapshot?:{commandSeals:number;usedOrders:string[]};paidAmmo?:number;round:number;formations:Formation[];queue:string[];activeIndex:number;supply:Record<Side,number>;ammo:Record<Side,number>;initialSupply:number;suppliedRounds:number;terrain:string[][];rallyUsed:boolean;auxSide:Side|'inactive'|null;auxEntryRound?:number;auxTroopsPerThousand?:number;dispatchPending:boolean;result:Result|null;scores:Record<Side,number>}
export interface State {
 schemaVersion:1|2;buildVersion:string;campaignId:'jp_tokugawa_sekigahara';runId:string;seed:number;rngStep:number;mode:Mode;phase:Phase;chapterIndex:number;commandSeals:number;resources:Resources;
 edo:{estimatedHouseholds:number;prosperity:number;publicOrder:number;defense:number;infrastructure:number;taxRatePercent:number;garrisonTroops:number;laborAllocation:{farms:number;workshops:number;works:number}};
 map:Record<string,string>;diplomacy:{coalitionCohesion:number;kobayakawaCommitment:number;intelligence:number};threats:{uesugiPressure:number;westernMomentum:number};
 playerArmy:{locationId:string;active:boolean;readiness:number;campaignSupplyReserveRice:number;protectedBattleRice:number;routeState:string;fieldworkTier:number;formations:Array<{id:string;troops:number;baseTroops:number;morale:number;equipmentPoints:number}>};
 westernState:{resources:Resources;momentum:number;administrativeQualityMinPerThousand:number;administrativeQualityMaxPerThousand:number;ordersPerWorldPhase:number;troopGain:number;gifuDefense:number;ogakiDefense:number;routeDamaged:boolean;used:string[];signals:string[]};
 projects:Array<{progress:number;required:number}>;activeOrder:Challenge|null;variants:Record<string,Challenge>;usedOrders:string[];crises:Crisis[];challengeRecords:RecordChallenge[];decisions:Array<{id:string;chapter:number;events:Event[]}>;flags:Record<string,boolean|number|string>;battle:Battle|null;ending:{tier:'good'|'normal'|'bad';mastery:number;realm:number;components:Record<string,number>;clauses:string[];summary:Record<string,number|string|boolean>}|null;eventLog:Event[];createdAt:string;updatedAt:string;chapterStart:number;reportSnapshots:Array<{chapter:number;resources:Resources}>;prep:{rounds:number;equipment:number[];ammo:number;supply:number};pendingReward:number|null;
}
export type Command=
 |{type:'ADVANCE'}|{type:'POLICY';id:string}|{type:'OPEN_ORDER';id:string;now?:number}|{type:'CLOSE_ORDER'}
 |{type:'ANSWER';answer:Answer;now?:number}|{type:'HINT'}|{type:'ADVISER'}|{type:'COMPLETE';path:'adviser'|'proceedEstimate'|'abandon';answer?:Answer;now?:number}
 |{type:'AUDIT_REWARD';resource:'food'|'currency'|'materials'}|{type:'FORFEIT_SEALS'}|{type:'END_CHAPTER'}|{type:'CRISIS_RESPONSE';response:'full'|'partial'|'accept';emergency?:Resource;now?:number}
 |{type:'PREP_PROVISION';rounds:number;now?:number}|{type:'PREP_WARCHEST';equipment:number[];ammo:number;now?:number}|{type:'DEPLOY';id:string;point:Point}|{type:'BEGIN_BATTLE'}
 |{type:'SKIP_PROVISION'}|{type:'CONVOY';start:boolean}|{type:'PLAN';plan:TacticalPlan;reserve?:string;entry?:ReserveEntry}|{type:'BATTLE_COUNCIL';choice:'open'|'continue'|'accept'}
 |{type:'BATTLE';id:string;action:BattleAction}|{type:'AI_TURN'}|{type:'WITHDRAW'};
export type BattleAction={kind:'move';point:Point}|{kind:'attack'|'charge'|'volley'|'suppress'|'rally';target:string}|{kind:'defend'|'brace'|'forced_step'|'end'|'attack_wagon'}|{kind:'resupply';rounds:number}|{kind:'pontoon';point:Point};
