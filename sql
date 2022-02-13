SELECT subk.id, subk.nama, COUNT(pen.subkriteriaId) as total 
	FROM `penilaian` as pen 
	JOIN subkriteria as subk ON pen.subkriteriaId = subk.id
    JOIN kriteria as k ON subk.kriteriaId = k.id
    WHERE k.id = 3
    GROUP BY pen.subkriteriaId;