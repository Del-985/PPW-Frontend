function calculateEstimate() {
  let total = 0;
  let breakdown = [];

  if (document.getElementById('driveway').checked) {
    let sqft = parseFloat(document.getElementById('drivewaySqft').value) || 0;
    let cost = Math.max(75, sqft * 0.2);
    total += cost;
    breakdown.push("Driveway: $" + cost.toFixed(2));
  }

  if (document.getElementById('roof').checked) {
    let sqft = parseFloat(document.getElementById('roofSqft').value) || 0;
    let cost = Math.max(125, sqft * 0.3);
    total += cost;
    breakdown.push("Roof: $" + cost.toFixed(2));
  }

  if (document.getElementById('gutter').checked) {
    total += 85;
    breakdown.push("Gutter: $85.00");
  }

  if (document.getElementById('lawn').checked) {
    let sqft = parseFloat(document.getElementById('lawnSqft').value) || 0;
    let cost = Math.max(50, sqft * 0.01);
    total += cost;
    breakdown.push("Lawn: $" + cost.toFixed(2));
  }

  document.getElementById('estimateResult').innerHTML =
    breakdown.join("<br>") + "<br><br><strong>Total: $" + total.toFixed(2) + "</strong>";
}
