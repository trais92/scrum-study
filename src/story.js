// ===== Story: three Sprints of beats. Every `g` entry is a verbatim Scrum Guide 2020 quote [text, section]. =====
const TEAM = ["jonas", "priya", "tom", "lea", "you"];
const ALL = ["jonas", "priya", "tom", "lea", "you", "maya", "hans"];
const DEV_NAMES = "Priya, Tom and Lea";

const Q = {
  select: ["Through discussion with the Product Owner, the Developers select items from the Product Backlog to include in the current Sprint.", "Sprint Planning"],
  forecast: ["However, the more the Developers know about their past performance, their upcoming capacity, and their Definition of Done, the more confident they will be in their Sprint forecasts.", "Sprint Planning"],
  invite: ["The Scrum Team may also invite other people to attend Sprint Planning to provide advice.", "Sprint Planning"],
  selfMgmt: ["They are also self-managing, meaning they internally decide who does what, when, and how.", "Scrum Team"],
  howDev: ["How this is done is at the sole discretion of the Developers. No one else tells them how to turn Product Backlog items into Increments of value.", "Sprint Planning"],
  convince: ["Those wanting to change the Product Backlog can do so by trying to convince the Product Owner.", "Product Owner"],
  order: ["Ordering Product Backlog items", "Product Owner"],
  respect: ["For Product Owners to succeed, the entire organization must respect their decisions.", "Product Owner"],
  daily: ["The Daily Scrum is a 15-minute event for the Developers of the Scrum Team.", "Daily Scrum"],
  sbPlan: ["The Sprint Backlog is a plan by and for the Developers.", "Sprint Backlog"],
  quality: ["Quality does not decrease", "The Sprint"],
  clarify: ["Scope may be clarified and renegotiated with the Product Owner as more is learned.", "The Sprint"],
  negotiate: ["If the work turns out to be different than they expected, they collaborate with the Product Owner to negotiate the scope of the Sprint Backlog within the Sprint without affecting the Sprint Goal.", "Commitment: Sprint Goal"],
  notDone: ["If a Product Backlog item does not meet the Definition of Done, it cannot be released or even presented at the Sprint Review. Instead, it returns to the Product Backlog for future consideration.", "Commitment: Definition of Done"],
  incDoD: ["Work cannot be considered part of an Increment unless it meets the Definition of Done.", "Increment"],
  timebox: ["Ensuring that all Scrum events take place and are positive, productive, and kept within the timebox.", "Scrum Master"],
  coach: ["Coaching the team members in self-management and cross-functionality", "Scrum Master"],
  retroImp: ["The Scrum Team identifies the most helpful changes to improve its effectiveness. The most impactful improvements are addressed as soon as possible. They may even be added to the Sprint Backlog for the next Sprint.", "Sprint Retrospective"],
  retroScope: ["The Scrum Team inspects how the last Sprint went with regards to individuals, interactions, processes, tools, and their Definition of Done.", "Sprint Retrospective"],
  review: ["The Sprint Review is a working session and the Scrum Team should avoid limiting it to a presentation.", "Sprint Review"]
};

// ----- shared helpers for the story -----
function seed(S, ids) { for (const id of ids) { const it = mk(S, id); it.where = "pb"; S.pb.push(id); } }
function topMove(S, n, why) { const ids = S.pb.slice(0, n); for (const id of ids) move(S, id, "sb", why); return ids; }
function goalText(parts) {
  if (parts.length === 1) return `Customers can ${parts[0]}.`;
  return `Customers can ${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}.`;
}
const GOAL_PART = { form: "book a repair online", price: "see the price first", pay: "pay by card when they book", cal: "pick their own repair slot" };
function carried(S, ids) { return (ids || ["form", "price", "pay"]).filter(id => S.items[id] && S.items[id].where === "pb"); }
function closeSprint(S, extra) {
  if (S.sprintRes[S.sp]) return S.sprintRes[S.sp].back;
  const back = [...(extra || []), ...returnUnfinished(S)];
  S.goalResult = goalMet(S) ? "done" : "missed";
  S.sprintRes[S.sp] = { goal: S.goal, met: S.goalResult === "done", back };
  return back;
}
function negPlan(S) {
  const f = forecast(S);
  if (!f.length) return null;
  const drop = f.filter(id => !S.goalItems.includes(id));
  const risk = f.filter(id => S.goalItems.includes(id));
  return { drop, risk };
}
function list(S, ids) {
  const n = ids.map(id => `“${N(S, id)}”`);
  return n.length <= 1 ? n.join("") : n.slice(0, -1).join(", ") + " and " + n[n.length - 1];
}
function negotiation(d, t) {
  return {
    k: "call", d, t, at: "team", cast: ["priya", "tom", "lea", "jonas", "you"], label: "Scope talk with Jonas",
    if: S => !!negPlan(S),
    pre: S => { S.neg = negPlan(S); S.mark = { ids: S.neg.drop.length ? S.neg.drop : S.neg.risk, label: S.neg.drop.length ? "Out of this Sprint?" : "At risk" }; },
    lines: S => {
      const n = S.neg;
      if (n.drop.length) {
        const L = [["tom", `At this pace, ${list(S, n.drop)} won't be Done by Friday.`], ["priya", "Let's talk to Jonas now, not at the Review."],
          ["jonas", `Then ${n.drop.length > 1 ? "they go" : "it goes"} back to the Product Backlog for now, and I'll re-order. Put your time on the Sprint Goal.`]];
        if (n.risk.length) L.push(["lea", `Even then, ${list(S, n.risk)} is tight. We'll all swarm on it.`]);
        return L;
      }
      return [["tom", `Even with all of us on it, ${list(S, n.risk)} is tight.`], ["priya", "Let's tell Jonas now, not at the Review."],
        ["jonas", "Thanks for saying it early. Put everything on the Sprint Goal; I'll let Maya know it might slip."]];
    },
    act: S => S.neg.drop.length ? "The Developers and Jonas are taking work out of this Sprint's scope." : "The Developers are telling Jonas the Sprint Goal is at risk, and re-planning.",
    ok: true,
    allowFb: "Right to let it happen. When the work turns out different than expected, the Developers work with the Product Owner to renegotiate the scope of the Sprint Backlog, without affecting the Sprint Goal. Doing it early, not at the Review, keeps everything transparent.",
    stepFb: "Nothing to fix here. This is what renegotiating scope should look like: early, with the Product Owner, and with the Sprint Goal in mind.",
    onAllow: S => {
      for (const id of S.neg.drop) { const it = S.items[id]; it.owner = null; it.badge = "Jonas re-orders"; it.droppedSp = S.sp; move(S, id, "pb", "Scope renegotiated with Jonas; he will re-order it", 0); }
      for (const dev of DEVS) if (S.neg.drop.includes(S.on[dev])) S.on[dev] = null;
      if (S.neg.risk.length) note(S, "Developers re-plan around the Sprint Goal", "Adapting their plan toward the Sprint Goal", "plan");
    },
    g: [Q.negotiate, Q.clarify]
  };
}
const day = d => ({ k: "day", d });
function hansTarget(S) {
  const a = S.on.tom;
  if (!a || !S.items[a] || !workable(S.items[a]) || S.items[a].kind !== "pbi") return null;
  const others = S.sb.filter(id => id !== a && S.items[id].kind === "pbi" && workable(S.items[id]));
  if (!others.length) return null;
  return [a, others.includes("map") ? "map" : others[others.length - 1]];
}
function planChanger(S) {
  for (const dev of ["tom", "lea", "priya"]) {
    const id = S.on[dev];
    if (id && S.items[id] && workable(S.items[id]) && S.items[id].kind === "pbi" && S.items[id].prog > 0) return [dev, id];
  }
  return null;
}

// ================= SPRINT 1 =================
const S1 = {
  title: "Sprint 1", name: "A new team", sub: "The team is new to Scrum, and so is everyone around it.",
  quiz: ["ev10", "ev11", "ev9", "sm7", "sm8", "sm9", "ar7", "ar8", "tm3", "ar19", "ar17", "ev24"],
  setup: S => {
    seed(S, ["form", "price", "email", "map", "sms", "card", "cal", "acct"]);
    S.items.email.trap = "dodTrap";
  },
  beats: [
    { k: "say", d: 1, t: "09:00", at: "workshop", cast: TEAM,
      n: "Monday, 09:00. It's your first Sprint as Scrum Master of the Spoke Repairs web team. The Sprint is two weeks long, and it starts with Sprint Planning in the Workshop.",
      lines: [["jonas", "Morning, everyone! I've ordered the Product Backlog. The top items are what customers ask for most."], ["lea", "And the Product Goal is still the same?"], ["jonas", "Yes. Customers book and pay for repairs online, without calling the shop."]],
      g: [["Sprint Planning initiates the Sprint by laying out the work to be performed for the Sprint.", "Sprint Planning"], ["Sprint Planning is timeboxed to a maximum of eight hours for a one-month Sprint. For shorter Sprints, the event is usually shorter.", "Sprint Planning"]] },

    { k: "who", t: "09:20", at: "workshop", cast: TEAM, label: "Who defines the Sprint Goal",
      lines: [["jonas", "Here's my proposal for this Sprint: customers can ask for a repair online and see what it will cost before they come in."]],
      q: "Topic one: why is this Sprint valuable? Jonas has made his proposal. Who now defines the Sprint Goal?",
      ans: "team",
      fb: "Jonas proposes how the product could gain value this Sprint. Then the whole Scrum Team works out the Sprint Goal together, and it must be final before Sprint Planning ends.",
      g: [["The Product Owner proposes how the product could increase its value and utility in the current Sprint. The whole Scrum Team then collaborates to define a Sprint Goal that communicates why the Sprint is valuable to stakeholders. The Sprint Goal must be finalized prior to the end of Sprint Planning.", "Sprint Planning"]],
      then: [["priya", "Can we say “request” instead of “book”? Without the calendar, customers can't pick a slot yet."], ["jonas", "Good point. Agreed."]],
      post: S => { S.goal = "Customers can request a repair online and see the price first."; S.goalItems = ["form", "price"]; note(S, "Sprint Goal added to the Sprint Backlog", "Defined by the whole Scrum Team", "goal"); } },

    { k: "call", t: "10:10", at: "workshop", cast: TEAM, label: "Jonas picks the Sprint's items",
      lines: [["jonas", "Topic two. I'll make it quick: these five come into the Sprint."], ["tom", "(quietly) Five? Hm."]],
      act: "Jonas is moving the top five items into the Sprint Backlog himself.",
      pre: S => { S.mark = { ids: S.pb.slice(0, 5), label: "Jonas → Sprint Backlog?" }; },
      ok: false,
      allowFb: "Jonas chose the work alone, and Tom already doubts it fits. In Sprint Planning the Developers select the items, in discussion with the Product Owner, because they know their capacity. The forecast now belongs to Jonas, not to the people doing the work.",
      onAllow: S => { topMove(S, 5, "Picked by Jonas alone"); S.flags.poPicked = true; },
      opts: [
        { t: "Thank Jonas for the order, then ask the Developers how much they think fits.", g: 2, fb: "Right. The Developers select the items, in discussion with the Product Owner. The more they know about their past performance, their capacity and their Definition of Done, the more confident their forecast.", fx: S => topMove(S, 4, "Selected by the Developers, in discussion with Jonas") },
        { t: "Set a limit yourself: three items, so nobody gets overloaded.", g: 0, fb: "You spotted the problem, but now you are choosing instead of Jonas. Selecting the work is the Developers' call, in discussion with the Product Owner.", fx: S => topMove(S, 3, "Picked by the Scrum Master") },
        { t: "Let the whole Scrum Team vote on each item.", g: 1, fb: "Better than Jonas deciding alone, but the Guide is specific: the Developers select the items, in discussion with the Product Owner.", fx: S => topMove(S, 4, "Selected by a team vote") }
      ],
      g: [Q.select, Q.forecast],
      then: S => S.sb.length === 4 ? [["priya", `We think four items fit. “${N(S, S.pb.find(id => !S.items[id].notReady))}” would be one too many.`], ["jonas", "Fine by me. The goal is covered."]] : S.sb.length === 5 ? [["lea", "Okay… we'll try."]] : [["tom", "Three, then. If you say so."]] },

    { k: "who", t: "11:30", at: "workshop", cast: TEAM, label: "Who decides how the work gets done",
      lines: [["lea", "Topic three: how do we build all this?"]],
      q: "Who decides how the selected items become a Done Increment?",
      ans: "dev",
      fb: "How to turn the selected items into a Done Increment is up to the Developers alone. Nobody else tells them how.",
      g: [Q.howDev],
      then: [["priya", "I'll take the booking form."], ["tom", "Price estimate for me."], ["lea", "Confirmation email. Whoever finishes first picks up the next item."]],
      post: S => {
        assign(S, "priya", "form"); assign(S, "tom", "price"); assign(S, "lea", "email");
        const T = { form: 5, price: 4, email: 3, map: 3, sms: 2 };
        for (const id of S.sb) if (S.items[id].kind === "pbi") S.items[id].tasks = T[id] || 3;
        note(S, "The Developers broke the items into tasks", "Their plan for the Sprint", "plan");
      } },

    { k: "say", t: "13:00", at: "workshop", cast: TEAM,
      n: "Sprint Planning ends at 13:00, after four hours. Look at the Sprint Backlog: the Sprint Goal, the selected items and the Developers' tasks together make up the Sprint Backlog.",
      g: [["The Sprint Goal, the Product Backlog items selected for the Sprint, plus the plan for delivering them are together referred to as the Sprint Backlog.", "Sprint Planning"]] },

    { k: "choice", t: "13:30", at: "team", cast: ["priya", "tom", "lea", "you"], label: "The first Daily Scrum",
      n: "13:30 in the team room. The Developers agreed to hold the Daily Scrum here at 13:30 every working day.",
      lines: [["lea", "So… Daily Scrum. Do you start, and we each report to you?"], ["tom", "Like a status meeting, right?"]],
      q: "The Developers wait for you to run their first Daily Scrum. What do you do?",
      opts: [
        { t: "Explain that it's their 15 minutes to inspect progress toward the Sprint Goal and plan the next day of work. Then step back.", g: 2, fb: "Right. The Daily Scrum is for the Developers. You make sure it happens and stays within 15 minutes, and they choose how to run it." },
        { t: "Run it for them this Sprint, and hand it over next Sprint.", g: 1, fb: "Kind, but it delays self-management. The Daily Scrum belongs to the Developers. Your part is making sure it takes place, is positive and productive, and keeps to its timebox." },
        { t: "Skip it today. Sprint Planning only ended half an hour ago.", g: 0, fb: "The Daily Scrum is held every working day of the Sprint, at the same time and place. Today is a working day of the Sprint too." }
      ],
      g: [["The Daily Scrum is a 15-minute event for the Developers of the Scrum Team. To reduce complexity, it is held at the same time and place every working day of the Sprint.", "Daily Scrum"], ["The Developers can select whatever structure and techniques they want, as long as their Daily Scrum focuses on progress toward the Sprint Goal and produces an actionable plan for the next day of work.", "Daily Scrum"]],
      then: [["priya", "Okay then: what do we each need to do by tomorrow to move toward the goal?"]] },

    day(2), day(3),

    { k: "call", d: 3, t: "11:00", at: "shop", cast: ["maya", "tom", "you"], label: "Maya asks Tom for a banner",
      lines: [["maya", "Tom! Can you put a “Winter check-up” banner on the homepage? Ten minutes, tops."], ["tom", "Sure, I'll add it to our board."]],
      act: "Tom is adding Maya's banner to the Sprint Backlog.",
      pre: S => { S.ghost = { n: CATALOG.banner[0], where: "sb", label: "Tom → Sprint Backlog?" }; },
      ok: false,
      allowFb: "New work just skipped the Product Owner. Anyone who wants to change the Product Backlog does it by convincing Jonas, who orders it. And “ten minutes” will cost Tom most of a day.",
      onAllow: S => { mk(S, "banner"); move(S, "banner", "sb", "Added by Tom for Maya, without Jonas"); S.items.banner.owner = "tom"; S.on.tom = "banner"; S.flags.banner = "sb"; },
      opts: [
        { t: "“Thanks, Maya! Jonas orders the Product Backlog. Let's take your idea to him.”", g: 2, fb: "Right. New work enters through the Product Owner. Jonas can weigh the banner against everything else in the Product Backlog.", fx: S => { mk(S, "banner"); move(S, "banner", "pb", "Maya convinced Jonas; he chose its place", 3); S.flags.banner = "pb"; } },
        { t: "“Tom, you're self-managing. You decide whether to do it.”", g: 0, fb: "Self-management covers how the Developers do their work. Which new work enters the product goes through the Product Owner.", fx: S => { mk(S, "banner"); move(S, "banner", "sb", "Added by Tom for Maya, without Jonas"); S.items.banner.owner = "tom"; S.on.tom = "banner"; S.flags.banner = "sb"; } },
        { t: "“Maya, bring it to the Sprint Review next week.”", g: 1, fb: "The Review is a good place for feedback, but there's no need to wait. Maya can talk to Jonas today.", fx: S => { S.flags.banner = "later"; } }
      ],
      g: [Q.convince, ["It is the single source of work undertaken by the Scrum Team.", "Product Backlog"]],
      then: S => S.flags.banner === "pb" ? [["jonas", "A banner for winter check-ups? Nice idea. I'll put it fourth; the booking work comes first."]] : S.flags.banner === "sb" ? [["tom", "On it. Ten minutes… probably."]] : [["maya", "Fine, I'll wait for the Review."]] },

    day(4),

    { k: "choice", d: 4, t: "13:45", at: "team", cast: ["priya", "lea", "tom", "you"], label: "IT blocks the booking form",
      pre: S => block(S, "form", 99, "Blocked"),
      n: "Right after the Daily Scrum.",
      lines: [["priya", "The booking form needs access to the shop's calendar system. IT says new access takes three weeks through their ticket queue."], ["lea", "We've asked twice. There's nothing more we can do from here."]],
      q: "The booking form is blocked by something outside the team's control. What do you do?",
      opts: [
        { t: "Go to the IT lead today, explain what is blocked and why it matters, and get the access sorted.", g: 2, fb: "Right. Causing the removal of impediments is one of the ways you serve the team. This one sits outside the team, and they already tried, so you act.", fx: S => { S.items.form.blocked = 1; } },
        { t: "Leave it with Priya. The Developers are self-managing.", g: 0, fb: "Self-management doesn't mean leaving the team alone with an impediment they can't remove. They already tried twice.", fx: S => { S.items.form.blocked = 5; S.flags.itSlow = true; } },
        { t: "Put it on the agenda for the Sprint Retrospective.", g: 0, fb: "The Retrospective is too late for this Sprint. When something goes off track, the adjustment should be made as soon as possible.", fx: S => { S.items.form.blocked = 5; S.flags.itSlow = true; } }
      ],
      g: [["Causing the removal of impediments to the Scrum Team’s progress", "Scrum Master"], ["The adjustment must be made as soon as possible to minimize further deviation.", "Adaptation"]],
      then: S => S.items.form.blocked === 1 ? [["you", "IT will set up the access tonight."], ["priya", "Brilliant. I'll work on something else until then."]] : [["priya", "Okay. I'll work on something else meanwhile and keep chasing IT."]] },

    day(5),

    { k: "call", d: 5, t: "10:00", at: "team", cast: ["hans", "tom", "priya", "lea", "you"], label: "Hans re-assigns Tom",
      if: S => !!hansTarget(S),
      pre: S => { const [a, b] = hansTarget(S); S.hans = [a, b]; S.mark = { ids: [a, b], label: "Hans moves Tom" }; },
      lines: S => [["hans", `Tom, leave “${N(S, S.hans[0])}” for now and do “${N(S, S.hans[1])}”. The shop needs it.`], ["tom", "Uh… okay?"]],
      act: "Hans is moving Tom to a different item on the Sprint Backlog.",
      ok: false,
      allowFb: "Hans just decided who does what. Scrum Teams are self-managing: they decide internally who does what, when and how. Tom loses a day switching, and his own item now waits.",
      onAllow: S => { const [a, b] = S.hans; S.on.tom = b; S.items[a].owner = null; S.lost.tom = [5]; S.flags.hansMoved = true; note(S, `Tom moved to “${N(S, b)}”`, "Decided by Hans, not the Developers", "plan"); },
      opts: [
        { t: "Talk with Hans one-on-one: the Developers decide who does what. Invite him to the Sprint Review to see the work and give feedback.", g: 2, fb: "Right. You protect self-management and still give Hans a real place to influence the product: the Sprint Review, and conversations with Jonas." },
        { t: "Tell Hans, in front of the team, that managers have no say in Scrum.", g: 1, fb: "Stopping it was right, but stakeholders do have a say, at the Sprint Review and through the Product Owner. And respect is a Scrum value; coaching Hans works better than embarrassing him." },
        { t: "Ask Tom to do what Hans says. Hans is the head of department.", g: 0, fb: "Hans is outside the Scrum Team. Scrum Teams are self-managing and decide internally who does what; his job title doesn't change that.", fx: S => { const [a, b] = S.hans; S.on.tom = b; S.items[a].owner = null; S.lost.tom = [5]; S.flags.hansMoved = true; note(S, `Tom moved to “${N(S, b)}”`, "Decided by Hans, not the Developers", "plan"); } }
      ],
      g: [Q.selfMgmt, ["They are structured and empowered by the organization to manage their own work.", "Scrum Team"], ["Removing barriers between stakeholders and Scrum Teams.", "Scrum Master"]],
      then: S => S.flags.hansMoved ? [["tom", "Fine. Switching now."]] : [["hans", "Hm. All right, I'll come to the Review, then."]] },

    day(6),

    { k: "call", d: 6, t: "14:00", at: "workshop", cast: TEAM, label: "Refinement splits card payment",
      n: "Product Backlog refinement in the Workshop, looking ahead to the next Sprint.",
      lines: [["jonas", "Card payment is too big for one item."], ["tom", "Let's split it: “Pay by card when booking” and “Saved cards for returning customers”."]],
      act: "The team is splitting one Product Backlog item into two smaller ones.",
      pre: S => { S.mark = { ids: ["card"], label: "Split in two?" }; },
      ok: true,
      allowFb: "Right to let it happen. Refinement means breaking items down into smaller, more precise items, and it goes on during the Sprint as needed.",
      stepFb: "Nothing was wrong here. Refinement is an ongoing activity, and during the Sprint the Product Backlog is refined as needed.",
      onAllow: S => {
        const i = S.pb.indexOf("card"); detach(S, "card"); S.items.card.where = "out";
        mk(S, "pay", null); mk(S, "saved", null); S.items.pay.holdSp = 1; S.items.saved.holdSp = 1;
        move(S, "pay", "pb", "Split from “Card payment when booking”", i); move(S, "saved", "pb", "Split from “Card payment when booking”", i + 1);
      },
      g: [["Product Backlog refinement is the act of breaking down and further defining Product Backlog items into smaller more precise items. This is an ongoing activity to add details, such as a description, order, and size.", "Product Backlog"], ["The Product Backlog is refined as needed", "The Sprint"]] },

    { k: "call", d: 6, t: "14:30", at: "workshop", cast: TEAM, label: "Jonas sizes the new items",
      lines: [["jonas", "Pay by card is a 3. Saved cards, a 2. I'll write it on the cards."], ["lea", "Hm. We've never used this payment provider…"]],
      act: "Jonas is writing sizes on the two new items.",
      pre: S => { S.mark = { ids: ["pay", "saved"], label: "Sized by Jonas?" }; },
      ok: false,
      allowFb: "The Developers who will do the work are responsible for sizing it. Lea already sees a risk that Jonas's numbers hide.",
      onAllow: S => { S.items.pay.s = 3; S.items.saved.s = 2; S.flags.sizedBy = "Jonas"; note(S, "Sizes written on the new items", "Sized by Jonas, not the Developers", "size"); },
      opts: [
        { t: "Ask the Developers to size them, and Jonas to explain the trade-offs that matter to him.", g: 2, fb: "Right. The Developers size the work. The Product Owner may influence them by helping them understand and select trade-offs.", fx: S => { S.items.pay.s = 7; S.items.saved.s = 3; S.flags.sizedBy = "dev"; note(S, "Sizes added to the new items", "Sized by the Developers", "size"); } },
        { t: "Size them yourself to settle it quickly.", g: 0, fb: "You spotted the problem, but you won't do this work, so you shouldn't size it either. Sizing belongs to the Developers.", fx: S => { S.items.pay.s = 5; S.items.saved.s = 2; S.flags.sizedBy = "you"; note(S, "Sizes added to the new items", "Sized by the Scrum Master", "size"); } },
        { t: "Let Jonas and the Developers agree together, with Jonas having the final say.", g: 1, fb: "Talking together is good, but the final say on size belongs to the Developers who will do the work.", fx: S => { S.items.pay.s = 4; S.items.saved.s = 2; S.flags.sizedBy = "Jonas"; note(S, "Sizes added to the new items", "Jonas had the final say", "size"); } }
      ],
      g: [["The Developers who will be doing the work are responsible for the sizing. The Product Owner may influence the Developers by helping them understand and select trade-offs.", "Product Backlog"]] },

    day(7),

    { k: "call", d: 7, t: "10:30", at: "team", cast: ["priya", "tom", "lea", "you"], label: "A Developer changes the plan",
      if: S => !!planChanger(S),
      pre: S => { S.pc = planChanger(S); S.mark = { ids: [S.pc[1]], label: "Tasks rewritten" }; },
      lines: S => { const [dev, id] = S.pc; const other = DEVS.find(d => d !== dev); return [[dev, `“${N(S, id)}” needs a different approach than we planned. I'm rewriting my tasks for it.`], [other, "Good. Keep the board honest."]]; },
      act: S => `${NAMES[S.pc[0]]} is changing tasks on the Sprint Backlog without asking anyone.`,
      ok: true,
      allowFb: "Right to let it happen. The Sprint Backlog is the Developers' own plan, updated throughout the Sprint as they learn more. The Daily Scrum is not the only time they may change it.",
      stepFb: "You stepped in on something healthy. The Developers adapt their plan whenever they learn something new; it's their plan to change.",
      onAllow: S => { const it = S.items[S.pc[1]]; it.tasks += 2; note(S, `Tasks re-planned on “${it.n}”`, `By ${NAMES[S.pc[0]]}, as the team learned more`, "plan"); },
      g: [Q.sbPlan, ["Consequently, the Sprint Backlog is updated throughout the Sprint as more is learned.", "Sprint Backlog"], ["The Daily Scrum is not the only time Developers are allowed to adjust their plan.", "Daily Scrum"]] },

    day(8),
    negotiation(8, "15:00"),
    day(9), day(10),

    { k: "say", d: 10, t: "10:00", at: "workshop", cast: ALL,
      n: "Friday, 10:00: Sprint Review. Maya and Hans join the Scrum Team to inspect the outcome of the Sprint and talk about progress toward the Product Goal. The timebox is up to four hours for a one-month Sprint; the team plans two.",
      pre: S => { if (S.items.email.bad) { const it = S.items.email; it.bad = false; it.pulled = true; move(S, "email", "pb", "Doesn't meet the Definition of Done: out of the Increment"); S.trust = clamp(S.trust - 5, 0, 100); } },
      lines: S => {
        const L = [["tom", "Here's what is Done this Sprint. Everything on the Increment board meets our Definition of Done."]];
        if (S.items.email.pulled) L.unshift(["lea", "Before we start: I tried the confirmation email on my phone this morning. It breaks. It never met our Definition of Done, so it's back in the Product Backlog and we won't present it."]);
        if (S.items.banner && S.items.banner.where === "inc") L.push(["jonas", "Wait, who added a winter banner? Nobody asked me."]);
        return L;
      },
      g: [["The purpose of the Sprint Review is to inspect the outcome of the Sprint and determine future adaptations. The Scrum Team presents the results of their work to key stakeholders and progress toward the Product Goal is discussed.", "Sprint Review"]] },

    { k: "choice", t: "10:30", at: "workshop", cast: ALL, label: "Maya wants to see unfinished work",
      if: S => !S.goalResult && unfinishedPBIs(S).length > 0,
      pre: S => { S.mark = { ids: unfinishedPBIs(S), label: "Not Done" }; },
      lines: S => [["maya", `Can you show us “${N(S, unfinishedPBIs(S)[0])}” too, even half-finished? I'd love a sneak peek.`]],
      q: "Maya wants to see work that isn't Done. What do you say?",
      opts: [
        { t: "“It isn't Done, so we don't present it. It goes back to the Product Backlog, and Jonas decides what happens to it.”", g: 2, fb: "Right. Work that doesn't meet the Definition of Done is not presented at the Sprint Review. It returns to the Product Backlog for future consideration." },
        { t: "“Sure, as long as Tom says clearly that it's unfinished.”", g: 0, fb: "A disclaimer doesn't fix it. If an item doesn't meet the Definition of Done, it can't even be presented at the Sprint Review." },
        { t: "“Only if Jonas agrees to show it.”", g: 0, fb: "This isn't Jonas's call to make. Work that doesn't meet the Definition of Done is never presented at the Sprint Review." }
      ],
      g: [Q.notDone],
      post: S => closeSprint(S) },

    { k: "choice", t: "10:30", at: "workshop", cast: ALL, label: "Can the Product Backlog change now?",
      if: S => !S.goalResult && unfinishedPBIs(S).length === 0,
      pre: S => { S.flags.askedPay = true; },
      lines: [["maya", "Customers keep asking whether they can pay when they book. Can that change what you do next?"], ["hans", "Surely the plan is fixed until the next Sprint Planning?"]],
      q: "Can the Product Backlog change during the Sprint Review?",
      opts: [
        { t: "Yes. The attendees work out together what to do next, and the Product Backlog may be adjusted.", g: 2, fb: "Right. The Sprint Review is a working session. Based on what was achieved and what has changed, attendees collaborate on what to do next." },
        { t: "No. The Product Backlog only changes at Sprint Planning.", g: 0, fb: "The Product Backlog is emergent and is refined as needed. At the Sprint Review it may be adjusted to meet new opportunities." },
        { t: "Only if Hans approves the change.", g: 0, fb: "Changes to the Product Backlog go through Jonas, the Product Owner, not a manager's approval." }
      ],
      g: [["Based on this information, attendees collaborate on what to do next. The Product Backlog may also be adjusted to meet new opportunities.", "Sprint Review"], Q.review],
      post: S => closeSprint(S) },

    { k: "who", t: "11:15", at: "workshop", cast: ALL, label: "Who re-orders the Product Backlog",
      lines: S => {
        const L = [["maya", S.flags.askedPay ? "So, Jonas: card payment next? Customers really want it." : "Customers ask me every day: can they pay by card when they book?"]];
        if (S.flags.banner === "later") L.push(["maya", "And Jonas, about that winter check-up banner…"]);
        return L;
      },
      q: "With the feedback in, the Product Backlog needs a new order. Who decides it?",
      ans: "po",
      fb: "Ordering the Product Backlog is Jonas's job as Product Owner. Anyone who wants a different order can try to convince him. Unfinished items don't go back on top automatically; Jonas decides where they belong.",
      g: [Q.order, Q.respect],
      post: S => {
        if (S.flags.banner === "later") { mk(S, "banner"); move(S, "banner", "pb", "Maya convinced Jonas at the Review"); }
        reorder(S, ["form", "price", "pay", "email", "sms", "map", "banner", "saved", "acct", "cal"], "Ordered by Jonas after the Sprint Review");
        S.items.cal.notReady = true;
      },
      then: S => {
        const c = carried(S, ["form", "price"]);
        const L = [];
        if (c.length) L.push(["jonas", `${list(S, c)} come${c.length > 1 ? "" : "s"} first; card payment builds on ${c.length > 1 ? "them" : "it"}.`]);
        L.push(["jonas", "Card payment moves near the top; customers ask for it every day. The booking calendar waits: it needs IT's new shop system, which comes next month."]);
        return L;
      } },

    { k: "choice", t: "14:00", at: "lounge", cast: TEAM, label: "Jonas wants to skip the Retro",
      n: "14:00 in the Lounge: Sprint Retrospective. (The Daily Scrum was at 13:30, as every day.)",
      lines: [["jonas", "I'll skip the Retro. It's for the Developers, right?"]],
      q: "Jonas wants to skip the Sprint Retrospective. What do you say?",
      opts: [
        { t: "“The Retrospective is for the whole Scrum Team, and that includes you.”", g: 2, fb: "Right. The Scrum Team inspects how the Sprint went, and Jonas is part of the Scrum Team. How the team worked with him is part of what they inspect." },
        { t: "“Sure. The Developers can speak more freely without you.”", g: 0, fb: "The Retrospective belongs to the whole Scrum Team: one Scrum Master, one Product Owner and the Developers. There are no sub-teams within a Scrum Team." },
        { t: "“Come for the first half, then you can go.”", g: 1, fb: "Half is better than nothing, but the Product Owner is a full member of the Scrum Team that inspects the Sprint." }
      ],
      g: [Q.retroScope, ["The Scrum Team consists of one Scrum Master, one Product Owner, and Developers.", "Scrum Team"]] },

    { k: "retro", t: "15:00", at: "lounge", cast: TEAM, label: "Retro improvement",
      lines: S => {
        const L = [];
        if (S.flags.itSlow) L.push(["priya", "Waiting a week for IT hurt us."]);
        L.push(["tom", "Only I know the payment provider, and card payment is next."], ["lea", "And checking phones by hand is slow."], ["jonas", "Requests reach the team from everywhere."]);
        return L;
      },
      q: "The team has three improvement ideas and will pick one for the next Sprint Backlog. They ask for your view first. Which one do you argue for?",
      opts: [{ t: PERKS.pairing.line, key: "pairing" }, { t: PERKS.autotest.line, key: "autotest" }, { t: PERKS.requests.line, key: "requests" }],
      fb: "The team agrees. The most impactful improvements are addressed as soon as possible, and they may even go into the next Sprint Backlog. Watch for it there.",
      fx: (S, o) => { S.nextImp = o.key; S.perks[o.key] = true; },
      g: [Q.retroImp, ["The Sprint Retrospective concludes the Sprint.", "Sprint Retrospective"]] },

    { k: "end", t: "15:30", at: "lounge", cast: TEAM }
  ]
};

// ================= SPRINT 2 =================
function planS2(S) {
  const c = carried(S, ["form", "price"]);
  S.goalItems = [...c, "pay"];
  S.goal = goalText(S.goalItems.map(id => GOAL_PART[id]));
  note(S, "Sprint Goal added to the Sprint Backlog", "Defined by the whole Scrum Team", "goal");
  const picked = select(S, 20, S.flags.overcommit, S.flags.overcommit ? "Selected under pressure from Hans" : "Selected by the Developers, in discussion with Jonas");
  if (S.nextImp) { const imp = mkImp(S, S.nextImp); move(S, imp.id, "sb", "Improvement from the last Retrospective", 0); assign(S, "lea", imp.id); }
  assign(S, "tom", "pay");
  const rest = picked.filter(id => id !== "pay");
  if (rest[0]) assign(S, "priya", rest[0]);
  if (!S.nextImp && rest[1]) assign(S, "lea", rest[1]);
  for (const id of picked) S.items[id].tasks = Math.max(2, Math.round(S.items[id].s * 0.7));
  note(S, "The Developers planned their tasks", "Their plan for the Sprint", "plan");
}
const S2 = {
  title: "Sprint 2", name: "Under pressure", sub: "A second shop is opening. Everyone wants everything, fast.",
  quiz: ["ev16", "sm11", "ar23", "ar24", "ev22", "sm17", "ev26", "sm19", "ev23", "ar15", "th7", "ar13"],
  setup: S => { S.absent = { tom: [4, 5, 6] }; },
  beats: [
    { k: "say", d: 1, t: "09:00", at: "workshop", cast: [...TEAM, "hans"],
      n: "Monday, 09:00. Sprint 2 starts right after the end of Sprint 1, again with Sprint Planning. Jonas has invited Hans to give advice: a second shop opens in three weeks.",
      lines: S => {
        const L = [["hans", "Thanks for having me. Timing matters with the new shop."]];
        if (S.flags.sizedBy !== "dev") L.push(["lea", `Before we select anything: card payment says ${S.items.pay.s}, but that wasn't our estimate. We've looked at it properly. It's a ${S.perks.autotest ? 6 : 7}.`]);
        else if (S.perks.autotest) L.push(["lea", "With the phone tests automated, card payment is a 6 now, not a 7."]);
        return L;
      },
      post: S => { S.items.pay.s = S.perks.autotest ? 6 : 7; S.items.saved.s = 3; },
      g: [["A new Sprint starts immediately after the conclusion of the previous Sprint.", "The Sprint"], Q.invite] },

    { k: "choice", t: "09:30", at: "workshop", cast: [...TEAM, "hans"], label: "Hans pushes for more scope",
      lines: [["hans", "For the new shop I need card payment, saved cards and customer accounts. All this Sprint."], ["priya", "That's a lot more than we finished last Sprint."]],
      q: "Hans wants more than the Developers think fits. What do you do?",
      opts: [
        { t: "Thank Hans for the context, and remind everyone that the Developers select what fits, in discussion with Jonas.", g: 2, fb: "Right. Hans's advice is welcome; that's why he was invited. But selecting the work is the Developers' call, in discussion with the Product Owner, based on their capacity and past performance." },
        { t: "Hans is senior. Take all three and see how far the team gets.", g: 0, fb: "Seniority doesn't change who selects the work. An overloaded forecast hides the real picture and puts the Sprint Goal at risk.", fx: S => { S.flags.overcommit = true; } },
        { t: "Ask Hans to leave. Sprint Planning is only for the Scrum Team.", g: 0, fb: "The Scrum Team may invite other people to Sprint Planning to give advice, and Jonas did. The problem isn't that Hans is here; it's who selects the work." }
      ],
      g: [Q.select, Q.invite, Q.forecast] },

    { k: "choice", t: "10:15", at: "workshop", cast: TEAM, label: "Jonas wants two Sprint Goals",
      lines: [["jonas", "Let's have two Sprint Goals this time: card payment, and customer accounts."]],
      q: "Jonas suggests two Sprint Goals. What do you say?",
      opts: [
        { t: "“A Sprint has one Sprint Goal. Let's agree on the single most valuable objective; other items can still come in if they fit.”", g: 2, fb: "Right. The Sprint Goal is the single objective for the Sprint. It creates focus and gets the team working together instead of on separate initiatives." },
        { t: "“Fine. Two goals give the team more options.”", g: 0, fb: "Two goals split the team's focus. The Sprint Goal is the single objective for the Sprint." },
        { t: "“Let's skip the Sprint Goal; the selected items say enough.”", g: 0, fb: "Every Sprint has a Sprint Goal. It's the commitment for the Sprint Backlog, and it must be finalized before Sprint Planning ends." }
      ],
      g: [["The Sprint Goal is the single objective for the Sprint.", "Commitment: Sprint Goal"], ["The Sprint Goal also creates coherence and focus, encouraging the Scrum Team to work together rather than on separate initiatives.", "Commitment: Sprint Goal"]],
      post: S => planS2(S),
      then: S => {
        const L = [["jonas", "One goal, then. Card payment it is."]];
        if (S.nextImp) L.push(["lea", `And our Retro improvement goes in too: “${PERKS[S.nextImp].n}”. I'll start with that.`]);
        L.push(["tom", "I'll take card payment."]);
        return L;
      } },

    day(2),

    { k: "choice", d: 2, t: "13:52", at: "team", cast: ["priya", "tom", "lea", "you"], label: "The Daily Scrum runs long",
      n: "13:52 in the team room. The Daily Scrum started at 13:30.",
      lines: [["tom", "If we use the provider's hosted payment page, we never store card numbers. But then the redirect back…"], ["priya", "…and the timeouts, and what if the bank says no…"]],
      q: "The Daily Scrum has turned into a deep technical debate, 22 minutes in. What do you do?",
      opts: [
        { t: "Point out the 15-minute timebox, and suggest Tom and Priya carry on right after, with whoever needs to be there.", g: 2, fb: "Right. The Daily Scrum stays within 15 minutes. Developers often meet during the day for more detailed discussions; this is one of those." },
        { t: "Let it run. It's all about the Sprint Goal.", g: 0, fb: "Being about the Sprint Goal doesn't stretch the timebox. The Daily Scrum is a 15-minute event." },
        { t: "Decide the technical approach for them, so the meeting can end.", g: 0, fb: "How to turn the work into an Increment is the Developers' decision alone. Your part is helping the event keep to its timebox." }
      ],
      g: [Q.daily, ["They often meet throughout the day for more detailed discussions about adapting or re-planning the rest of the Sprint’s work.", "Daily Scrum"], Q.timebox] },

    day(3),

    { k: "say", d: 3, t: "11:00", at: "jonas", cast: ["maya", "jonas", "you"], if: S => !!S.perks.requests,
      n: "Your improvement from the last Retrospective is working.",
      lines: [["maya", "Jonas, like we agreed: requests come to you. Gift vouchers, for Christmas?"], ["jonas", "Thanks for coming to me. Good idea. They go after saved cards; I'll look again before Christmas."]],
      post: S => { mk(S, "vouch"); const i = S.pb.indexOf("saved"); move(S, "vouch", "pb", "Maya convinced Jonas; he chose its place", i < 0 ? undefined : i + 1); },
      g: [Q.convince] },

    { k: "call", d: 3, t: "11:00", at: "team", cast: ["maya", "jonas", "lea", "you"], label: "Maya puts her idea on top", if: S => !S.perks.requests,
      lines: [["maya", "I've stuck “Gift vouchers” at the top of the Product Backlog. Christmas is coming!"]],
      act: "Maya is putting a new item at the top of the Product Backlog herself.",
      pre: S => { S.ghost = { n: CATALOG.vouch[0], where: "pb", pos: 0, label: "Maya → top of the Product Backlog?" }; },
      ok: false,
      allowFb: "Maya just ordered the Product Backlog herself. Ordering is the Product Owner's job, and the whole organization must respect his decisions. Jonas finds out later and has to sort it out.",
      onAllow: S => { mk(S, "vouch"); move(S, "vouch", "pb", "Put on top by Maya", 0); S.flags.mayaTop = true; },
      opts: [
        { t: "Thank her, and suggest she and Jonas look at it together. He orders the Product Backlog.", g: 2, fb: "Right. Maya's idea is welcome; the order is Jonas's call. Anyone who wants to change the Product Backlog does so by convincing the Product Owner.", fx: S => { mk(S, "vouch"); const i = S.pb.indexOf("saved"); move(S, "vouch", "pb", "Maya convinced Jonas; he chose its place", i < 0 ? undefined : i + 1); } },
        { t: "Move it to the bottom of the Product Backlog yourself.", g: 0, fb: "You spotted the problem, but now you are ordering the Product Backlog. That's the Product Owner's job, not yours.", fx: S => { mk(S, "vouch"); move(S, "vouch", "pb", "Moved down by the Scrum Master"); } },
        { t: "Leave it on top, but tell Jonas about it.", g: 1, fb: "Telling Jonas is good, but the order should come from him, not from whoever gets to the board first.", fx: S => { mk(S, "vouch"); move(S, "vouch", "pb", "Put on top by Maya", 0); S.flags.mayaTop = true; } }
      ],
      g: [Q.convince, Q.order, Q.respect],
      then: S => S.flags.mayaTop ? [["jonas", "(later) Why are gift vouchers on top? I need to talk to Maya."]] : [["jonas", "Gift vouchers are a nice idea. I'll find the right place for them."]] },

    day(4),

    { k: "say", d: 4, t: "09:30", at: "team", cast: ["lea", "priya", "you"], if: S => !!S.perks.pairing && isOpen(S.items.pay),
      n: "Your Retrospective improvement pays off.",
      lines: [["lea", "Tom is off sick until Tuesday. Good thing we paired on the payment provider: I can carry on with card payment."]],
      post: S => { S.on.lea = "pay"; note(S, "Lea takes over “Pay by card when booking”", "She paired with Tom on the provider", "plan"); },
      g: [["Scrum engages groups of people who collectively have all the skills and expertise to do the work and share or acquire such skills as needed.", "Scrum Theory"]] },

    { k: "choice", d: 4, t: "09:30", at: "team", cast: ["lea", "priya", "you"], label: "Tom is off sick",
      if: S => !S.perks.pairing && isOpen(S.items.pay),
      pre: S => block(S, "pay", 99, "Stalled"),
      lines: [["lea", "Tom is off sick until Tuesday, and he's the only one who knows the payment provider."], ["priya", "So card payment just stops?"]],
      q: "Card payment, the heart of the Sprint Goal, has stalled. What do you do?",
      opts: [
        { t: "Coach the Developers to work out together how to keep it moving, for example by learning the provider from its documentation.", g: 2, fb: "Right. A Scrum Team shares or acquires the skills it needs. The Developers decide how; you coach them in self-management and cross-functionality.", fx: S => { unblock(S, "pay", "Priya and Lea learn the provider together"); S.on.priya = "pay"; } },
        { t: "Ask Hans for a payments expert from another team, and tell the expert which tasks to do.", g: 1, fb: "Outside help can be fine if the Developers want it, but nobody tells them how to do the work, you included. And a newcomer needs time to get started.", fx: S => { S.items.pay.blocked = 2; } },
        { t: "Wait until Tom is back. It's his item.", g: 0, fb: "The Developers are accountable together, and the Sprint Goal is at risk. Scrum Teams share or acquire skills as needed instead of waiting for one person.", fx: S => { S.items.pay.blocked = 3; } }
      ],
      g: [Q.coach, ["Scrum engages groups of people who collectively have all the skills and expertise to do the work and share or acquire such skills as needed.", "Scrum Theory"]] },

    day(5),

    { k: "call", d: 5, t: "10:00", at: "team", cast: ["hans", "lea", "priya", "you"], label: "Hans wants to skip the tests",
      lines: [["hans", "Skip the code reviews and phone tests this Sprint. We need card payment live before the new shop opens."], ["lea", "Okay… I'll cross them off our Definition of Done for now."]],
      act: "Lea is crossing items off the Definition of Done.",
      pre: S => { S.mark = { dod: true, label: "Crossed off?" }; },
      ok: false,
      allowFb: "Quality does not decrease during a Sprint, and the Developers are required to conform to the Definition of Done. Anything “Done” this way isn't really Done, and it will show.",
      onAllow: S => { S.flags.dodDropped = true; S.dodStruck = true; note(S, "Definition of Done: code review and phone tests crossed off", "Under pressure from Hans", "dod"); },
      opts: [
        { t: "Keep the Definition of Done. If time is tight, the Developers talk with Jonas about scope instead.", g: 2, fb: "Right. Quality does not decrease, and the Definition of Done stays. Scope is what can be renegotiated with the Product Owner." },
        { t: "Agree, but only for the payment item.", g: 0, fb: "You spotted it, but agreed anyway. An item that skips the Definition of Done can't be part of the Increment, however important it is.", fx: S => { S.flags.dodDropped = true; S.dodStruck = true; note(S, "Definition of Done: code review and phone tests crossed off", "Under pressure from Hans", "dod"); } },
        { t: "Let Jonas decide whether the tests can be skipped.", g: 0, fb: "The Product Owner can't approve skipping the Definition of Done either. The Developers are required to conform to it.", fx: S => { S.flags.dodDropped = true; S.dodStruck = true; note(S, "Definition of Done: code review and phone tests crossed off", "Jonas allowed it", "dod"); } }
      ],
      g: [Q.quality, ["The Developers are required to conform to the Definition of Done.", "Commitment: Definition of Done"], Q.incDoD],
      then: S => S.flags.dodDropped ? [["hans", "Good. Speed matters."]] : [["hans", "Hm. Then tell Jonas what fits."], ["lea", "Will do."]] },

    day(6),

    { k: "call", d: 6, t: "11:00", at: "team", cast: ["priya", "jonas", "you"], label: "Jonas clarifies a detail", if: S => isOpen(S.items.pay),
      lines: [["priya", "Jonas, should the card receipt list the repair items, or just the total?"], ["jonas", "The items, please."], ["priya", "Got it. I'll add that to the item."]],
      act: "Jonas is clarifying an item in the Sprint Backlog; Priya updates it.",
      pre: S => { S.mark = { ids: ["pay"], label: "Detail added" }; },
      ok: true,
      allowFb: "Right to let it happen. During the Sprint, scope may be clarified with the Product Owner as more is learned. That's Jonas doing his job.",
      stepFb: "Nothing was wrong. Clarifying scope with the Product Owner during the Sprint is expected and healthy.",
      onAllow: S => { S.items.pay.detail = true; note(S, "“Pay by card when booking”: receipt detail added", "Clarified with Jonas; Priya updated the item", "note"); },
      g: [Q.clarify] },

    day(7),

    { k: "choice", d: 7, t: "10:00", at: "jonas", cast: ["jonas", "you"], label: "Jonas wants to add work mid-Sprint",
      if: S => S.items.vouch && S.items.vouch.where === "pb",
      lines: [["jonas", "Maya keeps asking about gift vouchers. Should I just add them to this Sprint?"]],
      q: "Jonas asks whether to add new work to the current Sprint. What do you say?",
      opts: [
        { t: "Help him think it through: would it endanger the Sprint Goal, and what do the Developers say about their capacity?", g: 2, fb: "Right. Scope can be renegotiated with the Product Owner as more is learned, as long as nothing endangers the Sprint Goal. You help Jonas think it through; you don't decide for him.",
          fx: S => {
            const T = clone(S); move(T, "vouch", "sb", ""); const f = forecast(T);
            if (!f.length) { move(S, "vouch", "sb", "Added by the Developers with Jonas; the Sprint Goal is safe"); S.flags.vouch = "added"; } else S.flags.vouch = "wait";
          } },
        { t: "“No. Nothing can change once a Sprint has started.”", g: 0, fb: "That's too strict. During the Sprint, scope may be clarified and renegotiated with the Product Owner. What must not happen is a change that endangers the Sprint Goal.", fx: S => { S.flags.vouch = "no"; } },
        { t: "“You're the Product Owner. Just add it.”", g: 0, fb: "Jonas owns the Product Backlog, but the Sprint Backlog is the Developers' plan. Adding work means talking with them and making sure it doesn't endanger the Sprint Goal.", fx: S => { move(S, "vouch", "sb", "Added by Jonas alone"); S.flags.vouch = "forced"; } }
      ],
      g: [["No changes are made that would endanger the Sprint Goal", "The Sprint"], Q.clarify],
      then: S => ({ added: [["priya", "We have room. Gift vouchers come in, and the Sprint Goal stays safe."]], wait: [["priya", "We're full. If vouchers come in, the Sprint Goal is at risk."], ["jonas", "Then they wait in the Product Backlog."]], no: [["jonas", "Okay… I'll tell Maya no."]], forced: [["lea", "Wait, we're already full…"]] })[S.flags.vouch] },

    day(8),
    negotiation(8, "15:00"),
    day(9), day(10),

    { k: "say", d: 10, t: "10:00", at: "workshop", cast: ALL,
      n: "Sprint Review. The Scrum Team and the stakeholders look at what was achieved and at what has changed around them, like the new shop.",
      pre: S => {
        S.pulled = S.inc.filter(id => S.items[id].untested);
        for (const id of S.pulled) { S.items[id].untested = false; S.items[id].live = false; move(S, id, "pb", "Skipped the Definition of Done: out of the Increment"); }
        if (S.pulled.length) S.trust = clamp(S.trust - 8, 0, 100);
        closeSprint(S, S.pulled);
      },
      lines: S => {
        if (S.pulled.length) return [["maya", `I tried “${N(S, S.pulled[0])}” on my phone just now. It fails at the last step.`], ["lea", "We skipped the phone tests. Honestly, it isn't Done."], ["tom", `So we can't present ${S.pulled.length > 1 ? "those items" : "it"}. ${S.pulled.length > 1 ? "They go" : "It goes"} back to the Product Backlog.`]];
        const L = [["tom", "Everything on the Increment board meets our Definition of Done."]];
        if (S.flags.release === "early") L.push(["maya", `Customers have been using “${N(S, S.flags.releaseItem)}” for days already. Two told me they love it.`]);
        return L;
      },
      g: [["During the event, the Scrum Team and stakeholders review what was accomplished in the Sprint and what has changed in their environment.", "Sprint Review"], Q.notDone] },

    { k: "choice", t: "10:40", at: "workshop", cast: ALL, label: "Hans wants an email instead",
      lines: [["hans", "Honestly, these Reviews take my time. Couldn't Jonas just email me a summary each Sprint?"]],
      q: "Hans wants to replace the Sprint Review with an email. What do you do?",
      opts: [
        { t: "Explain what he'd lose, inspecting the real Increment together and shaping what comes next. Then ask what would make the Review more useful for him.", g: 2, fb: "Right. The Sprint Review is a working session where the Scrum Team and stakeholders inspect the outcome and decide on adaptations together. Helping Hans see that is part of how you serve the organization." },
        { t: "Agree. Hans is busy, and an email is more efficient.", g: 0, fb: "An email can't replace the stakeholders and the Scrum Team inspecting the Increment together and adapting the Product Backlog." },
        { t: "Tell him stakeholders are required to attend by Scrum's rules.", g: 0, fb: "Quoting rules won't win Hans over. The Review only works when key stakeholders take part, so help him see its value." }
      ],
      g: [Q.review, ["Helping employees and stakeholders understand and enact an empirical approach for complex work", "Scrum Master"]],
      post: S => closeSprint(S) },

    { k: "say", t: "11:20", at: "workshop", cast: ALL,
      lines: S => {
        const L = [["maya", "Customers also ask if they can choose their own repair time."], ["jonas", "IT's new shop system is live now, so the booking calendar can come next."]];
        if (S.flags.mayaTop) L.push(["jonas", "And Maya, gift vouchers stay in, but I'm moving them down. Let's talk about why."]);
        return L;
      },
      post: S => {
        S.items.cal.notReady = false;
        reorder(S, ["form", "price", "pay", "cal", "vouch", "email", "map", "banner", "sms", "saved", "acct"], "Ordered by Jonas after the Sprint Review");
      },
      g: [["The Product Backlog may also be adjusted to meet new opportunities.", "Sprint Review"], Q.order] },

    { k: "choice", t: "14:00", at: "lounge", cast: TEAM, label: "A wall of problems at the Retro",
      lines: S => [["tom", "We've written fourteen sticky notes of problems."], S.flags.dodDropped ? ["lea", "And dropping the tests was a mistake. We want our Definition of Done back, stronger."] : ["priya", "Where do we even start?"]],
      q: "The team has a wall of problems. How do you help?",
      opts: [
        { t: "Help them find the few changes that would help most, and plan to act on them as soon as possible.", g: 2, fb: "Right. The Scrum Team identifies the most helpful changes, and addresses the most impactful ones as soon as possible." },
        { t: "Turn all fourteen into an action list for next Sprint.", g: 0, fb: "Fourteen actions at once usually means none get done. The Retrospective looks for the most helpful changes." },
        { t: "Pick the most important ones for them, so the meeting ends on time.", g: 1, fb: "Keeping the timebox matters, but the team identifies its own improvements. You help them do it." }
      ],
      g: [Q.retroImp, ["The Scrum Team discusses what went well during the Sprint, what problems it encountered, and how those problems were (or were not) solved.", "Sprint Retrospective"]],
      post: S => { if (S.flags.dodDropped) { S.flags.dodDropped = false; S.dodStruck = false; S.dod.push("Payments tested in the provider's test mode"); note(S, "Definition of Done restored and strengthened", "Inspected at the Sprint Retrospective", "dod"); } } },

    { k: "retro", t: "15:00", at: "lounge", cast: TEAM, label: "Retro improvement",
      q: "Three improvement ideas made the shortlist for the next Sprint Backlog. The team wants your view. Which one do you argue for?",
      opts: [{ t: PERKS.timer.line, key: "timer" }, { t: PERKS.dodwall.line, key: "dodwall" }, { t: PERKS.agenda.line, key: "agenda" }],
      fb: "The team agrees, and the improvement goes into the next Sprint Backlog, so it gets addressed as soon as possible.",
      fx: (S, o) => { S.nextImp = o.key; S.perks[o.key] = true; },
      g: [Q.retroImp] },

    { k: "end", t: "15:30", at: "lounge", cast: TEAM }
  ]
};

// ================= SPRINT 3 =================
function planS3(S) {
  const c = carried(S);
  S.goalItems = ["cal", ...c];
  S.goal = c.length ? goalText(["pick their own repair slot", ...c.map(id => GOAL_PART[id])]) : "Customers pick their own repair slot in a live calendar.";
  note(S, "Sprint Goal added to the Sprint Backlog", "Defined by the whole Scrum Team", "goal");
  const picked = select(S, 20, false, "Selected by the Developers, in discussion with Jonas");
  if (S.nextImp) { const imp = mkImp(S, S.nextImp); move(S, imp.id, "sb", "Improvement from the last Retrospective", 0); assign(S, "tom", imp.id); }
  assign(S, "priya", "cal"); assign(S, "lea", "cal");
  const rest = picked.filter(id => id !== "cal");
  if (!S.nextImp && rest[0]) assign(S, "tom", rest[0]);
  for (const id of picked) S.items[id].tasks = Math.max(2, Math.round(S.items[id].s * 0.7));
}
const S3 = {
  title: "Sprint 3", name: "Turbulence", sub: "The company grows, a competitor moves, and the Product Goal is in sight.",
  quiz: ["tm10", "tm11", "ar22", "ev7", "ev8", "ar4", "ar3", "ev1", "sm20", "ar20", "ev21", "ev14"],
  setup: S => {},
  beats: [
    { k: "choice", d: 1, t: "08:30", at: "hans", cast: ["hans", "you"], label: "Six more Developers",
      n: "Monday, 08:30, before Sprint Planning. Hans has news.",
      lines: [["hans", "Six more developers join next month. Should we make two teams, each with its own Product Owner and its own backlog?"]],
      q: "How should the growing group be set up to work on one product?",
      opts: [
        { t: "Form several cohesive Scrum Teams that share the same Product Goal, Product Backlog and Product Owner.", g: 2, fb: "Right. If Scrum Teams grow too large, they should consider reorganizing into multiple cohesive Scrum Teams focused on the same product, sharing one Product Goal, one Product Backlog and one Product Owner." },
        { t: "Yes: two teams, each with its own Product Owner and Product Backlog.", g: 0, fb: "Teams working on the same product should share the same Product Goal, Product Backlog and Product Owner. Two backlogs would split one product in two." },
        { t: "Keep one team of eleven, with a lead developer to coordinate.", g: 0, fb: "A Scrum Team is typically 10 or fewer people, and within it there are no sub-teams or hierarchies, so no lead developer either." }
      ],
      g: [["If Scrum Teams become too large, they should consider reorganizing into multiple cohesive Scrum Teams, each focused on the same product. Therefore, they should share the same Product Goal, Product Backlog, and Product Owner.", "Scrum Team"], ["The Scrum Team is small enough to remain nimble and large enough to complete significant work within a Sprint, typically 10 or fewer people.", "Scrum Team"]] },

    { k: "who", t: "08:45", at: "hans", cast: ["hans", "you"], label: "One Definition of Done for two teams",
      lines: [["hans", "And with two teams, does each team keep its own Definition of Done?"]],
      q: "Two Scrum Teams will work on the same product. How is their Definition of Done handled?",
      opts: [
        { key: "same", t: "The teams mutually define and comply with the same one" },
        { key: "own", t: "Each team keeps its own, as long as it's strict", wrong: "Not separate ones." },
        { key: "po", t: "Jonas defines it for both teams", wrong: "Not the Product Owner alone." },
        { key: "sm", t: "The Scrum Masters define it for both teams", wrong: "Not the Scrum Masters." }
      ],
      ans: "same",
      fb: "When several Scrum Teams work together on a product, they must mutually define and comply with the same Definition of Done.",
      g: [["If there are multiple Scrum Teams working together on a product, they must mutually define and comply with the same Definition of Done.", "Commitment: Definition of Done"]] },

    { k: "call", t: "09:15", at: "workshop", cast: [...TEAM, "maya"], label: "Maya advises at Sprint Planning",
      n: "Sprint Planning in the Workshop. Jonas proposes making the booking calendar this Sprint's focus.",
      lines: [["priya", "I've asked Maya to join us for an hour. She knows how repair slots really work in the shop."], ["maya", "Happy to help. Mornings fill up first, by the way."]],
      act: "A stakeholder is joining Sprint Planning.",
      ok: true,
      allowFb: "Right to let it happen. The Scrum Team may invite other people to Sprint Planning to give advice. Maya advises; the Developers still select the work and plan it.",
      stepFb: "Nothing was wrong. The Scrum Team may invite others to Sprint Planning to provide advice.",
      g: [Q.invite],
      post: S => planS3(S),
      then: S => {
        const L = [["lea", `So our Sprint Goal is: “${S.goal}”`], ["lea", "With Maya's input, Priya and I will both work on the calendar."]];
        if (S.nextImp) L.push(["tom", `And I'll start on our Retro improvement: “${PERKS[S.nextImp].n}”.`]);
        return L;
      } },

    day(2),

    { k: "call", d: 2, t: "13:35", at: "team", cast: ["jonas", "priya", "tom", "lea", "you"], label: "Jonas runs the Daily Scrum",
      lines: [["jonas", "Quick round, everyone. Tom, status? Priya, status? And Lea, leave the calendar today and help Tom."]],
      act: "Jonas is taking over the Daily Scrum and re-arranging the Developers' work.",
      pre: S => { S.mark = { ids: ["cal"], label: "Jonas re-plans?" }; },
      ok: false,
      allowFb: "The Daily Scrum is the Developers' event, and the Sprint Backlog is their plan. Jonas isn't working on Sprint Backlog items, so he doesn't take part as a participant, and he doesn't plan the Developers' day.",
      onAllow: S => { S.on.lea = null; S.lost.lea = [2]; S.flags.jonasDaily = true; note(S, "Lea moved off the calendar", "Decided by Jonas at the Daily Scrum", "plan"); },
      opts: [
        { t: "Ask the Developers what their plan for today is, then talk with Jonas afterwards: the Daily Scrum is where the Developers plan their day. He can see the Sprint Backlog any time and talk with them whenever he has news.", g: 2, fb: "Right. The Daily Scrum belongs to the Developers. A Product Owner joins it as a Developer only when working on Sprint Backlog items. Coaching Jonas keeps the event theirs." },
        { t: "Let him. He's accountable for the value of the product.", g: 0, fb: "Being accountable for value doesn't make the Product Owner the planner of the Developers' day. The Sprint Backlog is a plan by and for the Developers.", fx: S => { S.on.lea = null; S.lost.lea = [2]; S.flags.jonasDaily = true; note(S, "Lea moved off the calendar", "Decided by Jonas at the Daily Scrum", "plan"); } },
        { t: "Ban Jonas from the team room during the Sprint.", g: 0, fb: "Jonas should talk with the Developers often; they clarify and renegotiate scope with him. The only problem was that he took over their event and their plan." }
      ],
      g: [Q.daily, ["If the Product Owner or Scrum Master are actively working on items in the Sprint Backlog, they participate as Developers.", "Daily Scrum"], Q.sbPlan] },

    day(3),

    { k: "choice", d: 3, t: "10:00", at: "team", cast: ["priya", "lea", "you"], label: "Priya and Lea disagree",
      if: S => isOpen(S.items.cal),
      pre: S => block(S, "cal", 99, "Stuck"),
      lines: [["priya", "The calendar should load free slots live from the shop system."], ["lea", "No, a nightly copy is safer. We've argued about it since yesterday."]],
      q: "Two Developers are stuck in a technical disagreement on the Sprint Goal's main item. What do you do first?",
      opts: [
        { t: "Help them talk it through: what each option risks, and what they'd need to know to decide. Then let them decide.", g: 2, fb: "Right. How the work gets done is the Developers' decision. You coach self-management; you don't take the decision away from them.", fx: S => unblock(S, "cal", "Priya and Lea agreed an approach") },
        { t: "Decide for them, so the work moves again.", g: 0, fb: "Quick, but it takes a decision away from the Developers, and next time they'll wait for you again.", fx: S => { unblock(S, "cal", "The Scrum Master decided for them"); S.items.cal.s += 2; S.flags.smDecided = true; note(S, "“Booking calendar” grows by 2", "Lea reworks parts she never agreed with", "size"); } },
        { t: "Ask Jonas to make the call.", g: 0, fb: "Jonas decides on value and order, not on how things are built. How to turn items into an Increment is at the sole discretion of the Developers.", fx: S => { S.items.cal.blocked = 3; } }
      ],
      g: [Q.howDev, Q.coach],
      then: S => S.items.cal.blocked ? [["lea", "Fine, we'll wait for Jonas…"]] : S.flags.smDecided ? [["lea", "(quietly) A nightly copy would have been safer…"]] : [["lea", "Okay: live slots, with a nightly copy as backup. Deal."]] },

    day(4),

    { k: "choice", d: 4, t: "11:00", at: "hans", cast: ["hans", "you"], label: "Hans wants the Sprint cancelled",
      lines: [["hans", "Our competitor just launched online booking with loyalty stamps! Cancel this Sprint and start on loyalty stamps today."]],
      q: "Hans wants the Sprint cancelled. What do you say?",
      opts: [
        { t: "“Only Jonas can cancel a Sprint, and it only makes sense if the Sprint Goal has become obsolete. Let's take the news to him now.”", g: 2, fb: "Right. A Sprint could be cancelled if the Sprint Goal becomes obsolete, and only the Product Owner has the authority to cancel it." },
        { t: "“Agreed. I'll tell the team to stop.”", g: 0, fb: "Neither you nor Hans can cancel a Sprint. Only the Product Owner has that authority, and only when the Sprint Goal becomes obsolete. The team lost a day before Jonas heard about it.", fx: S => { S.lost = { priya: [4], tom: [4], lea: [4] }; S.flags.stopped = true; note(S, "The team stops work for a day", "Told to stop by the Scrum Master", "block"); } },
        { t: "“Sprints can never be cancelled.”", g: 0, fb: "They can, but only by the Product Owner, and only if the Sprint Goal becomes obsolete." }
      ],
      g: [["A Sprint could be cancelled if the Sprint Goal becomes obsolete. Only the Product Owner has the authority to cancel the Sprint.", "The Sprint"]],
      then: S => [["jonas", (S.flags.stopped ? "(later) Who told the team to stop? " : "(later) ") + "Customers still need to pick their own slots, so our Sprint Goal still makes sense. I'm not cancelling. Loyalty stamps go into the Product Backlog near the top, and we'll talk about them at the Review."]],
      post: S => { mk(S, "loyal"); S.items.loyal.notReady = true; move(S, "loyal", "pb", "Added by Jonas after the competitor news", 1); } },

    day(5),

    { k: "call", d: 5, t: "10:00", at: "team", cast: ["priya", "tom", "you"], label: "Priya picks her own next task",
      lines: [["priya", "My task is finished. I'll take the next one from the board myself."]],
      act: "Priya is choosing her next piece of work without asking anyone.",
      ok: true,
      allowFb: "Right to let it happen. Self-managing teams decide internally who does what, when and how. Nobody needs to hand Priya her next task.",
      stepFb: "That was healthy self-management. The Developers decide who does what; there was nothing to fix.",
      g: [["Scrum Teams are cross-functional, meaning the members have all the skills necessary to create value each Sprint. They are also self-managing, meaning they internally decide who does what, when, and how.", "Scrum Team"]] },

    day(6),

    { k: "call", d: 6, t: "11:00", at: "team", cast: ["hans", "lea", "you"], label: "A company Definition of Done",
      lines: S => [["hans", "IT has published a company standard: every release must pass a security scan."], ["lea", S.perks.dodwall ? "Our Definition of Done on the wall doesn't have that yet. I'm adding it." : "Our Definition of Done doesn't have that yet. I'm adding it."]],
      act: "Lea is adding the company standard to the team's Definition of Done.",
      pre: S => { S.mark = { dod: true, label: "Adding a line" }; },
      ok: true,
      allowFb: "Right. If the Definition of Done is part of the organization's standards, all Scrum Teams must follow it as a minimum. Teams can add to it, but not go below it.",
      stepFb: "Nothing to fix. An organizational Definition of Done is the minimum every Scrum Team must follow.",
      onAllow: S => { S.dod.push("Security scan passes"); note(S, "Definition of Done: “Security scan passes” added", "Company standard, the minimum for every team", "dod"); },
      g: [["If the Definition of Done for an increment is part of the standards of the organization, all Scrum Teams must follow it as a minimum.", "Commitment: Definition of Done"]] },

    day(7),

    { k: "choice", d: 7, t: "15:00", at: "team", cast: ["tom", "priya", "you"], label: "Tom wants a longer Sprint",
      lines: [["tom", "We're so close. Can we just make this Sprint two days longer?"]],
      q: "Tom asks to extend the Sprint. What do you say?",
      opts: [
        { t: "“Sprints have a fixed length. If not everything fits, let's talk with Jonas about scope.”", g: 2, fb: "Right. Sprints are fixed-length events of one month or less, which creates consistency. Scope is what can be renegotiated with the Product Owner." },
        { t: "“Fine, two extra days, just this once.”", g: 0, fb: "Stretching a Sprint breaks its fixed length and the rhythm of inspection. Renegotiate scope with the Product Owner instead." },
        { t: "“Okay, and the next Sprint will be two days shorter to make up for it.”", g: 0, fb: "That breaks the fixed length twice. The team adjusts scope, not the calendar." }
      ],
      g: [["They are fixed length events of one month or less to create consistency.", "The Sprint"], Q.clarify],
      then: S => S.res && S.res.g === 2 ? [["tom", "Fair. Let's see what Jonas says if it gets tight."]] : [["priya", "Hold on. Our Sprints are two weeks, always. Let's talk scope with Jonas instead."]] },

    day(8),
    negotiation(8, "15:00"),
    day(9), day(10),

    { k: "say", d: 10, t: "10:00", at: "workshop", cast: ALL,
      n: "The third Sprint Review. The Scrum Team and the stakeholders inspect the Increment and check progress toward the Product Goal.",
      pre: S => { S.reviewBack = unfinishedPBIs(S); closeSprint(S); S.pgoalDone = PG_ITEMS.every(id => S.items[id] && S.items[id].where === "inc"); },
      lines: S => {
        const L = [];
        if (S.reviewBack.length) L.push(["tom", `${list(S, S.reviewBack)} ${S.reviewBack.length > 1 ? "aren't" : "isn't"} Done, so ${S.reviewBack.length > 1 ? "they go" : "it goes"} back to the Product Backlog. Here's everything that is.`]);
        if (S.pgoalDone) L.push(["jonas", "Look at this: customers can book and pay online, without calling the shop. Our Product Goal is reached."], ["maya", "The phone has gone quiet. In a good way."]);
        else L.push(["jonas", `We're closer. Still missing for the Product Goal: ${list(S, PG_ITEMS.filter(id => !(S.items[id] && S.items[id].where === "inc")))}.`]);
        return L;
      },
      g: [["The Scrum Team presents the results of their work to key stakeholders and progress toward the Product Goal is discussed.", "Sprint Review"]] },

    { k: "who", t: "10:40", at: "workshop", cast: ALL, label: "Who owns the Product Goal",
      lines: S => S.pgoalDone ? [["hans", "So what's the next big target?"]] : [["hans", "Should we keep going with this Product Goal?"]],
      q: "Who is accountable for developing and explicitly communicating the Product Goal?",
      ans: "po",
      fb: S => S.pgoalDone ? "Developing and communicating the Product Goal is part of the Product Owner's Product Backlog management. A team fulfils (or abandons) one Product Goal before taking on the next, and this one is fulfilled." : "Developing and communicating the Product Goal is part of the Product Owner's Product Backlog management. The team keeps working toward it until it is fulfilled (or abandoned).",
      g: [["Developing and explicitly communicating the Product Goal", "Product Owner"], ["The Product Goal is the long-term objective for the Scrum Team. They must fulfill (or abandon) one objective before taking on the next.", "Commitment: Product Goal"]],
      then: S => S.pgoalDone ? [["jonas", "Here's my proposal for the next Product Goal: returning customers manage their bikes and bookings in one account."]] : [["jonas", "Yes. We keep going: the Product Goal still matters to customers."]],
      post: S => { if (S.pgoalDone) { S.pgoal = NEXT_PRODUCT_GOAL; note(S, "New Product Goal in the Product Backlog", "Developed and communicated by Jonas", "goal"); } } },

    { k: "say", t: "11:20", at: "workshop", cast: ALL,
      lines: [["maya", "One more thing: business customers ask if they can pay later, by invoice."], ["jonas", "Noted. It goes into the Product Backlog, and I'll decide its place next to loyalty stamps."]],
      post: S => { mk(S, "invoice"); move(S, "invoice", "pb", "Feedback from the Sprint Review, added by Jonas", 2); },
      g: [["The Product Backlog is an emergent, ordered list of what is needed to improve the product.", "Product Backlog"]] },

    { k: "choice", t: "14:00", at: "lounge", cast: TEAM, label: "Keep the Retro technical?",
      lines: [["lea", "Can we keep the Retro to technical topics? Talking about how we work together is awkward."]],
      q: "What does the Sprint Retrospective inspect?",
      opts: [
        { t: "Individuals, interactions, processes, tools and the Definition of Done. Offer a format that makes the people side easier to talk about.", g: 2, fb: "Right. The Retrospective covers how the Sprint went for individuals, interactions, processes, tools and the Definition of Done. Making that safe to talk about helps keep the event positive and productive." },
        { t: "Only the product and the code. People topics belong in one-on-ones.", g: 0, fb: "The Retrospective explicitly includes individuals and interactions, not only processes and tools." },
        { t: "Whatever Hans thinks needs improving.", g: 0, fb: "The Scrum Team inspects its own Sprint and finds its own improvements." }
      ],
      g: [Q.retroScope, ["The purpose of the Sprint Retrospective is to plan ways to increase quality and effectiveness.", "Sprint Retrospective"]] },

    { k: "end", t: "15:30", at: "lounge", cast: TEAM }
  ]
};

const SPRINTS = [S1, S2, S3];

// ----- Beats that interrupt the schedule when something happens on the board -----
const EVENTS = {
  dodTrap: {
    k: "call", at: "team", cast: ["lea", "tom", "you"], label: "Lea wants to call the email Done",
    lines: [["lea", "The confirmation email works on my laptop. I'll move it to Done; we can test it on phones next Sprint."]],
    act: "Lea is moving the email into the Increment without the phone tests.",
    pre: S => { S.mark = { ids: ["email"], label: "Lea → Increment?" }; },
    ok: false,
    allowFb: "The email skipped part of the Definition of Done. Work can't be part of the Increment unless it meets the Definition of Done, and “next Sprint” has a way of never coming.",
    onAllow: S => { const it = S.items.email; it.st = null; it.badge = null; it.bad = true; S.flags.dodTrap = "allowed"; move(S, "email", "inc", "Lea marked it Done without the phone tests"); },
    opts: [
      { t: "“It stays in the Sprint Backlog until it meets the Definition of Done. How long do the phone tests need?”", g: 2, fb: "Right. Done means meeting the Definition of Done, nothing less. The email stays in the Sprint Backlog until it does.",
        fx: S => { const it = S.items.email; it.st = null; it.badge = null; it.prog = it.s - 1; S.flags.dodTrap = "fixed"; S.on.lea = "email"; note(S, "“Booking confirmation email” stays in the Sprint Backlog", "Not Done yet: the phone tests are missing", "block"); } },
      { t: "“Move it to Done, but add a note: phone tests pending.”", g: 0, fb: "A note doesn't make it Done. The Definition of Done gives everyone the same understanding of what is complete; a half-tested item breaks that.",
        fx: S => { const it = S.items.email; it.st = null; it.badge = null; it.bad = true; S.flags.dodTrap = "allowed"; move(S, "email", "inc", "Marked Done with a note: phone tests pending"); } },
      { t: "“Let's change the Definition of Done to desktop tests only, just for this Sprint.”", g: 0, fb: "Quality does not decrease during the Sprint. The Definition of Done isn't loosened to make one item fit.",
        fx: S => { const it = S.items.email; it.st = null; it.badge = null; it.bad = true; S.flags.dodTrap = "allowed"; move(S, "email", "inc", "Done only after loosening the Definition of Done"); } }
    ],
    g: [Q.incDoD, ["The Definition of Done creates transparency by providing everyone a shared understanding of what work was completed as part of the Increment.", "Commitment: Definition of Done"]],
    then: S => S.flags.dodTrap === "fixed" ? [["lea", "Fair. I'll run the phone tests next."]] : [["tom", "Hm. If you say so."]]
  },
  release: {
    k: "choice", at: "team", cast: ["priya", "jonas", "you"], label: "Release before the Review?",
    lines: S => [["priya", `“${N(S, S.flags.releaseItem)}” meets the Definition of Done. Do we put it live now, or wait for the Sprint Review?`]],
    q: "An item is Done in the middle of the Sprint. What do you say?",
    opts: [
      { t: "“If you and Jonas want it out, put it live now. The Review isn't a gate.”", g: 2, fb: "Right. An Increment may be delivered to stakeholders before the Sprint ends. The Sprint Review should never be considered a gate to releasing value.",
        fx: S => { S.flags.release = "early"; for (const id of S.inc) if (S.items[id].sp === S.sp) S.items[id].live = true; note(S, `“${N(S, S.flags.releaseItem)}” is live for customers`, "Released before the Sprint Review", "live"); note(S, "Released: from now on each Done item goes live", "The Developers and Jonas agreed on it", "live"); } },
      { t: "“Wait for the Sprint Review, so the stakeholders can approve it first.”", g: 0, fb: "The Sprint Review is not an approval gate. A Done Increment can be delivered before the Sprint ends.", fx: S => { S.flags.release = "wait"; } },
      { t: "“Only Hans can sign off a release.”", g: 0, fb: "The Scrum Guide has no such sign-off, and the Sprint Review isn't a gate either. A Done Increment may be delivered before the Sprint ends.", fx: S => { S.flags.release = "wait"; } }
    ],
    g: [["However, an Increment may be delivered to stakeholders prior to the end of the Sprint. The Sprint Review should never be considered a gate to releasing value.", "Increment"], ["Multiple Increments may be created within a Sprint.", "Increment"]]
  }
};

// ----- "Who decides?" rapid round. Answers: po, dev, sm, team -----
const BLITZ = [
  ["Accountable for ordering the Product Backlog items", "po", "Ordering Product Backlog items", "Product Owner", "Others, including Developers, may do the ordering if the Product Owner delegates it, but the Product Owner stays accountable for it."],
  ["Developing and explicitly communicating the Product Goal", "po", "Developing and explicitly communicating the Product Goal", "Product Owner", "The Scrum Master only helps find techniques for defining the Product Goal. Developing and communicating it is part of the Product Owner's accountability for Product Backlog management (the work may be delegated)."],
  ["Accountable for maximizing the value of the product", "po", "The Product Owner is accountable for maximizing the value of the product resulting from the work of the Scrum Team.", "Product Owner", "Easy to mix up: the whole Scrum Team is accountable for a valuable, useful Increment each Sprint, but maximizing the product's value is the Product Owner's accountability."],
  ["The authority to cancel a Sprint", "po", "Only the Product Owner has the authority to cancel the Sprint.", "The Sprint", "Not management, not the Scrum Master, not the Developers. A Sprint could be cancelled if the Sprint Goal becomes obsolete."],
  ["In Sprint Planning: proposing how the product could increase its value in the current Sprint", "po", "The Product Owner proposes how the product could increase its value and utility in the current Sprint.", "Sprint Planning", "The proposal comes from the Product Owner. After that, the whole Scrum Team works together to define the Sprint Goal."],
  ["Remaining accountable for effective Product Backlog management even when others do that work", "po", "The Product Owner may do the above work or may delegate the responsibility to others. Regardless, the Product Owner remains accountable.", "Product Owner", "Delegating the work never moves the accountability. The people doing the delegated work are not accountable for it."],
  ["Responsible for sizing Product Backlog items", "dev", "The Developers who will be doing the work are responsible for the sizing.", "Product Backlog", "Not the Product Owner. The Product Owner may influence the Developers by helping them understand and select trade-offs."],
  ["Accountable for creating a plan for the Sprint, the Sprint Backlog", "dev", "Creating a plan for the Sprint, the Sprint Backlog", "Developers", "The trap: Sprint Planning as a whole is collaborative work of the entire Scrum Team, but the Sprint Backlog is a plan by and for the Developers, and creating it is their accountability."],
  ["Selecting the Product Backlog items for the Sprint, through discussion with the Product Owner", "dev", "Through discussion with the Product Owner, the Developers select items from the Product Backlog to include in the current Sprint.", "Sprint Planning", "The Product Owner discusses and clarifies, but does not pick the items for the Developers."],
  ["Deciding how the selected work becomes a Done Increment", "dev", "No one else tells them how to turn Product Backlog items into Increments of value.", "Sprint Planning", "No one tells the Developers how to turn Product Backlog items into Increments, not the Product Owner and not the Scrum Master."],
  ["Holding each other accountable as professionals", "dev", "Holding each other accountable as professionals", "Developers", "The Guide lists this among the Developers' accountabilities, next to creating the Sprint Backlog, following the Definition of Done and adapting their plan each day."],
  ["The Daily Scrum is a 15-minute event for…", "dev", "The Daily Scrum is a 15-minute event for the Developers of the Scrum Team.", "Daily Scrum", "The Daily Scrum is for the Developers. If the Product Owner or Scrum Master is actively working on Sprint Backlog items, they participate as Developers."],
  ["The Guide calls the Sprint Goal a commitment by…", "dev", "Although the Sprint Goal is a commitment by the Developers, it provides flexibility in terms of the exact work needed to achieve it.", "Commitment: Sprint Goal", "The trap: the whole Scrum Team defines the Sprint Goal, but the Guide calls it a commitment by the Developers."],
  ["Required to conform to the Definition of Done while doing the work", "dev", "The Developers are required to conform to the Definition of Done.", "Commitment: Definition of Done", "When the Definition of Done is an organizational standard, all Scrum Teams must follow it as a minimum, but the Guide places the specific requirement to conform to it on the Developers."],
  ["Adapting the plan each day toward the Sprint Goal", "dev", "Adapting their plan each day toward the Sprint Goal", "Developers", "The Sprint Backlog is a plan by and for the Developers, so adapting it each day is their accountability."],
  ["In Sprint Planning: defining the Sprint Goal", "team", "The whole Scrum Team then collaborates to define a Sprint Goal that communicates why the Sprint is valuable to stakeholders.", "Sprint Planning", "Not the Product Owner alone: the Product Owner proposes how to increase value, then the whole Scrum Team defines the Sprint Goal together."],
  ["Accountable for creating a valuable, useful Increment every Sprint", "team", "The entire Scrum Team is accountable for creating a valuable, useful Increment every Sprint.", "Scrum Team", "Not only the Developers: the entire Scrum Team holds this accountability, even though the Developers create the Increment."],
  ["Creating the Definition of Done when the organization has no standard one", "team", "If it is not an organizational standard, the Scrum Team must create a Definition of Done appropriate for the product.", "Commitment: Definition of Done", "Not the Developers alone and not the Scrum Master: when there's no organizational standard, the Scrum Team creates it."],
  ["Responsible for all product-related activities, from stakeholder collaboration to maintenance and operation", "team", "The Scrum Team is responsible for all product-related activities from stakeholder collaboration, verification, maintenance, operation, experimentation, research and development, and anything else that might be required.", "Scrum Team", "The Scrum Team is cross-functional and self-managing, so the Guide gives all product-related activities to the whole team."],
  ["At the Sprint Retrospective: inspecting how the last Sprint went", "team", "The Scrum Team inspects how the last Sprint went with regards to individuals, interactions, processes, tools, and their Definition of Done.", "Sprint Retrospective", "The Sprint Retrospective is for the whole Scrum Team, including the Product Owner and the Scrum Master."],
  ["Accountable for the Scrum Team's effectiveness", "sm", "The Scrum Master is accountable for the Scrum Team’s effectiveness.", "Scrum Master", "Effectiveness is the Scrum Master's accountability; maximizing product value is the Product Owner's."],
  ["Causing the removal of impediments to the Scrum Team's progress", "sm", "Causing the removal of impediments to the Scrum Team’s progress", "Scrum Master", "Note the wording: causing the removal, not removing. The Scrum Master may remove an impediment or get others to remove it."],
  ["Ensuring that all Scrum events take place and are positive, productive, and kept within the timebox", "sm", "Ensuring that all Scrum events take place and are positive, productive, and kept within the timebox.", "Scrum Master", "The Scrum Master ensures the events take place and are positive, productive and kept within the timebox. The Guide doesn't make the Scrum Master the facilitator of every event."],
  ["Coaching the team members in self-management and cross-functionality", "sm", "Coaching the team members in self-management and cross-functionality", "Scrum Master", "This is how the Scrum Master serves the Scrum Team: by coaching, not by managing or assigning work."],
  ["Accountable for establishing Scrum as defined in the Scrum Guide", "sm", "The Scrum Master is accountable for establishing Scrum as defined in the Scrum Guide.", "Scrum Master", "The Scrum Master does this by helping everyone, in the Scrum Team and in the organization, understand Scrum theory and practice."],
  ["Facilitating stakeholder collaboration for the Product Owner, as requested or needed", "sm", "Facilitating stakeholder collaboration as requested or needed.", "Scrum Master", "Stakeholder collaboration is a Scrum Team activity. Facilitating it, as requested or needed, is one way the Scrum Master serves the Product Owner."],
  ["Removing barriers between stakeholders and Scrum Teams", "sm", "Removing barriers between stakeholders and Scrum Teams.", "Scrum Master", "This is one way the Scrum Master serves the whole organization."],
  ["Helping find techniques for effective Product Goal definition and Product Backlog management", "sm", "Helping find techniques for effective Product Goal definition and Product Backlog management", "Scrum Master", "The Product Owner is accountable for the Product Goal and Product Backlog management. The Scrum Master helps find techniques."]
];

if (typeof module !== "undefined") module.exports = { SPRINTS, EVENTS, BLITZ, Q };
