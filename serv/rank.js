const _ = require('lodash')

function mapGap(x) {
	if (x == 0) return 7;
	if (x == 1) return 6.5;
	if (x == -1) return 6;
	if (x == 2) return 5.5;
	if (x == -2) return  5;
	if (x == 3) return 4.5;
	if (x == -3) return 4;
	if (x == 4) return 3.5;
	if (x == -4) return 3;
	if (x == 5) return 2.5;
	if (x == -5) return 2;
	if (x == 6) return 1.5;
	if (x == -6) return 1;
	throw new Error(`x = ${x}`)
}

function rank(options) {
	let kriterias = options.kriterias;
	kriterias = _.sortBy(kriterias, it => it.id)

	const profileTargets = kriterias.map(it => it.target)
	const bobots = kriterias.map(it => it.bobot / 100.0)
	const types = kriterias.map(it => it.core)
	const n_core = types.filter(it => it).length;
	const n_secondary = types.length - n_core;

	let items = options.items;

	items = items.filter(it => it.penilaians.length == kriterias.length);

	const alts = items.map(m => {
		let penilaians = m.penilaians;
		penilaians = _.sortBy(penilaians, it => it.subkriteria.kriteria.id)
		const xs = penilaians.map(it => {
			return it.subkriteria.bobot;
		})
		return xs
	})

	const gapDifference = alts.map(row => {
		return row.map((x, i) => x - profileTargets[i])
	})

	const gapMapped = gapDifference.map(row => {
		return row.map((x, i) => mapGap(x))
	})

	const CS_vals = gapMapped.map(row => {
		const xsCore = row.filter((x, i) => types[i]);
		const xsSecondary = row.filter((x, i) => !types[i]);
		const tc = xsCore.reduce((a, b) => a + b, 0) / n_core;
		const ts = xsSecondary.reduce((a, b) => a + b, 0) / n_secondary;
		return { tc, ts }
	})

	const totalVals = CS_vals.map((pack, index) => {
		const ntcf = bobots
			.map((b, i) => ({
				weight: b,
				core: types[i]
			}))
			.filter(it => it.core)
			.map(it => it.weight * pack.tc)
			.reduce((a, b) => a + b, 0)
		const ntsf = bobots
			.map((b, i) => ({
				weight: b,
				core: types[i]
			}))
			.filter(it => !it.core)
			.map(it => it.weight * pack.ts)
			.reduce((a, b) => a + b, 0)

		return (0.66 * ntcf) + (ntsf * 0.33)
	})

	// console.log(totalVals[5]);
	// throw new Error('stop');

	let results = items.map((m, i) => {
		return {
			...m,
			pm_value: totalVals[i]
		}
	})

	const resultSorted = _.reverse(_.sortBy(results, it => it.pm_value))
	results = resultSorted.map((it, index) => {
		return {
			...it,
			index: index + 1
		}
	})
	return results;
}

module.exports.rank = rank;