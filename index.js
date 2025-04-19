const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

//── ① Data from your sheet ────────────────────────────────
const stock = {
  C1: { A: 3, B: 2, C: 8 },
  C2: { D: 12, E: 25, F: 15 },
  C3: { G: 0.5, H: 1, I: 2 }
};
const distToL1 = { C1: 3, C2: 2.5, C3: 2 };
const BASE_RATE = 10;
const EXTRA_RATE = 8;

function costRate(w) {
  if (w <= 5) return BASE_RATE;
  return BASE_RATE + Math.ceil((w - 5) / 5) * EXTRA_RATE;
}

function permute(arr) {
  if (!arr.length) return [[]];
  return arr.flatMap((x,i) =>
    permute(arr.slice(0,i).concat(arr.slice(i+1)))
      .map(r => [x, ...r])
  );
}

app.post("/calculate-cost", (req, res) => {
  const order = req.body;
  // build center→weight map
  const cw = {};
  for (let [p,q] of Object.entries(order)) {
    const c = Object.keys(stock).find(c=>stock[c][p]!=null);
    if (!c) return res.status(400).json({error:`Unknown product ${p}`});
    cw[c] = (cw[c]||0) + stock[c][p]*q;
  }
  const centers = Object.keys(cw);
  let minCost = Infinity;

  for (let route of permute(centers)) {
    let cost = 0;
    // first pickup → loaded → L1
    cost += distToL1[route[0]] * costRate(cw[route[0]]);
    // for each next center: empty L1→center + loaded center→L1
    for (let i=1; i<route.length; i++) {
      const c = route[i];
      cost += distToL1[c] * BASE_RATE;
      cost += distToL1[c] * costRate(cw[c]);
    }
    minCost = Math.min(minCost, cost);
  }

  res.json({ minimum_cost: centers.length?minCost:0 });
});

app.listen(PORT,()=>console.log(`Listening on ${PORT}`));
