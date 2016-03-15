function sortByTomatoScore(a, b) {
    var aScore = 0;
	var bScore = 0;

	if (a.tomatoMeter != "N/A"){
		aScore = 0.6 * a.tomatoMeter + 0.4 * a.tomatoUserMeter
	}

	if (b.tomatoMeter != "N/A"){
		bScore = 0.6 * b.tomatoMeter + 0.4 * b.tomatoUserMeter
	}

	return bScore - aScore;
}