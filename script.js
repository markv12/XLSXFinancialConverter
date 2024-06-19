document.getElementById('convertButton').addEventListener('click', function() {
    let fileInput = document.getElementById('fileInput');
    let file = fileInput.files[0];
    if (!file) {
        alert('Please select a file first.');
        return;
    }

    let reader = new FileReader();

    reader.onload = function(e) {
      let data = new Uint8Array(e.target.result);
      let workbook = XLSX.read(data, {type: 'array', raw: true});
      let sheetName = workbook.SheetNames[0];
      let worksheet = workbook.Sheets[sheetName];
      let aoaSheet = XLSX.utils.sheet_to_json(worksheet, {header: 1}); //header: 1 creates array of arrays instead of JSON

      let currentId = "";
      let currentName = "";
      let resultRows = [];

      aoaSheet.forEach(function(csvLine, index) {
        const col1 = csvLine[0] ? csvLine[0].trim() : null;
        const col2 = csvLine[1];
        const col3 = csvLine[2];
        if (index === 4) {
          csvLine[0] = "gl account name";
          csvLine.unshift('gl account id');
          resultRows.push(csvLine);
        } else if (index > 4) {
          if (col2 !== 'Beginning Balance' && (!col1 || !col1.startsWith('Total for '))) {
            if (col1 && col1 !== '') {
              if (col1 === 'Not Specified') {
                currentId = " ";
                currentName = col1;
              } else {
                const glParts = col1.split(/ (.*)/s);
                if (glParts.length !== 3 || glParts[2] !== "") { //The 3rd element of the array will always be an empty string
                  console.log('Error parsing line: ', csvLine);
                } else {
                  currentId = glParts[0];
                  currentName = glParts[1];
                }
              }
            } else if (col3 && col3.trim() !== '') {
              csvLine[0] = currentName;
              csvLine.unshift(currentId);
              resultRows.push(csvLine);
            }
          }
        }
      });

      let resultWorksheet = XLSX.utils.aoa_to_sheet(resultRows);
      let csv = XLSX.utils.sheet_to_csv(resultWorksheet);

      let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      let link = document.createElement('a');
      if (link.download !== undefined) {
        let originalFileName = file.name.split('.').slice(0, -1).join('.');
        let newFileName = originalFileName + '_processed.csv';
        let url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', newFileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    reader.readAsArrayBuffer(file);
});
