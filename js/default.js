function array_intersect (arr1) {
  // http://kevin.vanzonneveld.net
  // +   original by: Brett Zamir (http://brett-zamir.me)
  // %        note 1: These only output associative arrays (would need to be
  // %        note 1: all numeric and counting from zero to be numeric)
  // *     example 1: $array1 = {'a' : 'green', 0:'red', 1: 'blue'};
  // *     example 1: $array2 = {'b' : 'green', 0:'yellow', 1:'red'};
  // *     example 1: $array3 = ['green', 'red'];
  // *     example 1: $result = array_intersect($array1, $array2, $array3);
  // *     returns 1: {0: 'red', a: 'green'}
  var retArr = {},
    argl = arguments.length,
    arglm1 = argl - 1,
    k1 = '',
    arr = {},
    i = 0,
    k = '';

  arr1keys: for (k1 in arr1) {
    arrs: for (i = 1; i < argl; i++) {
      arr = arguments[i];
      for (k in arr) {
        if (arr[k] === arr1[k1]) {
          if (i === arglm1) {
            retArr[k1] = arr1[k1];
          }
          // If the innermost loop always leads at least once to an equal value, continue the loop until done
          continue arrs;
        }
      }
      // If it reaches here, it wasn't found in at least one array, so try next value
      continue arr1keys;
    }
  }

  return retArr;
}

// http://stackoverflow.com/a/5860190
function array_combinations(array) {
	return Array.prototype.reduce.call(array, function(a, b) {
	  var ret = [];
	  a.forEach(function(a) {
	    b.forEach(function(b) {
	      ret.push(a.concat([b]));
	    });
	  });
	  return ret;
	}, [[]]);
}

function array_pairs(arr, allowsDuplicates) {
	var pairs = [];
	for (var i = 0; i <= arr.length - 2; ++i) {
		for (var j = i + !allowsDuplicates; j <= arr.length - 1; ++j) {
			pairs.push([arr[i], arr[j]]);
		}
	}
	return pairs;
}

;(function ($, window, undefined) {
	var pairs1to6 = array_pairs('123456', true),
		columbiaDays = "UMTWRFS";
	
	function minutesSinceWeekStart(day, time) {
		var date = new Date("Mar 15, 1994 " + time);
		return columbiaDays.indexOf(day) * 1440 + date.getHours() * 60 + date.getMinutes();
	}
	
	function datesConflict(days1, start1, end1, days2, start2, end2) {
		if (!days1 || !days2) return false;
		var doesConflict = false;
		
		$.each(array_intersect(days1.split(''), days2.split('')), function(i, day) {
			var start1Mins = minutesSinceWeekStart(day, start1),
				end1Mins = minutesSinceWeekStart(day, end1),
				start2Mins = minutesSinceWeekStart(day, start2),
				end2Mins = minutesSinceWeekStart(day, end2);
			doesConflict = (start1Mins <= end2Mins) && (end1Mins >= start2Mins);
			return !doesConflict;
		});
		
		return doesConflict;
	}
	
	var meetsOn = 'MeetsOn', startTime = 'StartTime', endTime = 'EndTime';
	
	function parseArrayOfClassSections(classes) {
		var busyTimes = $.map($('#busy-times').text().split('\n'), function(val, i) {
			return [val.split(' ')];
		});
		
		var newClasses = []
		$.each(classes, function(i, aClass) {
			var validSections = $.grep(aClass, function(section, i) {
				var doesConflict = false;
				
				$.each(busyTimes, function(i, busyTimeArray) {
					$.each([1,2,3,4,5,6], function(i, num) {
						doesConflict = datesConflict(section[meetsOn+num], section[startTime+num], section[endTime+num], busyTimeArray[0], busyTimeArray[1], busyTimeArray[2]);
						return !doesConflict;
					});
					
					return !doesConflict;
				});
				
				return !doesConflict;
			});
			newClasses.push(validSections);
		});
		classes = newClasses;
		
		var sectionCombinations = array_combinations(classes),
			validSectionCombinations = [];
		$.each(sectionCombinations, function(i, sections) {
			var pairs = array_pairs(sections, false);
			
			var doesConflict = false;
			$.each(pairs, function(i, pair) {
				var el1 = pair[0], el2 = pair[1];
				
				$.each(pairs1to6, function(i, digitPair) {
					var d1 = digitPair[0], d2 = digitPair[1];
					doesConflict = datesConflict(el1[meetsOn+d1], el1[startTime+d1], el1[endTime+d1], el2[meetsOn+d2], el2[startTime+d2], el2[endTime+d2]);
					return !doesConflict;
				});
				
				return !doesConflict;
			});
			
			if (!doesConflict)
				validSectionCombinations.push(sections);
		});
		
		$('#results').show();
		
		$("#slider").slider({
			value:0,
			min: 0,
			max: validSectionCombinations.length - 1,
			slide: function(event, ui) {
				calendar.fullCalendar('refetchEvents');
			}
		});
		$( "#amount" ).val( "$" + $( "#slider" ).slider( "value" ) );
		
				var permutations = $('#permutations');
		permutations.html('');
		for (var i = 1; i <= validSectionCombinations.length; ++i) {
			permutations.append('<option value="p'+i+'">Permutation '+i+'</option>');
		}
		
		var calendar = $('#calendar');
		
		permutations.unbind().change(function(ev) {
			calendar.fullCalendar('refetchEvents');
		}).change();
		
		calendar.html('').fullCalendar({
			events: function(start, end, callback) {
				var events = [], index = $('#slider').slider("value");
				$.each(validSectionCombinations[index], function(i, section) {
					var url = ['http:\/\/www.columbia.edu\/cu\/bulletin\/uwb\/subj\/', section['Course'].replace(/([A-Z]{4})([0-9]{4})([A-Z])([0-9]{3})/, "$1/$3$2-"+section['Term']+"-$4")].join('');
					$.each([1,2,3,4,5,6], function(i, num) {
						if (!section[meetsOn+num]) return;
						$.each(section[meetsOn+num].split(''), function(i, day) {
							var startTimeString = section[startTime+num],
								startTimeHours = parseInt(startTimeString.slice(0,2)),
								startTimeMinutes = parseInt(startTimeString.slice(3,5)),
								endTimeString = section[endTime+num],
								endTimeHours = parseInt(endTimeString.slice(0,2)),
								endTimeMinutes = parseInt(endTimeString.slice(3,5));
							events.push({
								start: new Date(2013, 2, 3+columbiaDays.indexOf(day), startTimeHours, startTimeMinutes),
								end: new Date(2013, 2, 3+columbiaDays.indexOf(day), endTimeHours, endTimeMinutes),
								url: url,
								title: [section['CourseTitle'], ' (&sect;', section['Course'].slice(-3), ') (', section['CallNumber'], ')'].join('')
							});
						});
					});
				});
				$.each(busyTimes, function(i, busyTimeArray) {
					var startTimeString = busyTimeArray[1],
						startTimeHours = parseInt(startTimeString.slice(0,2)),
						startTimeMinutes = parseInt(startTimeString.slice(3,5)),
						endTimeString = busyTimeArray[2],
						endTimeHours = parseInt(endTimeString.slice(0,2)),
						endTimeMinutes = parseInt(endTimeString.slice(3,5));
					events.push({
						start: new Date(2013, 2, 3+columbiaDays.indexOf(busyTimeArray[0]), startTimeHours, startTimeMinutes),
						end: new Date(2013, 2, 3+columbiaDays.indexOf(busyTimeArray[0]), endTimeHours, endTimeMinutes),
						title: "Unavailable",
						backgroundColor: 'red'
					});
				});
				callback(events);
			},
			defaultView: 'agendaWeek',
			header: null,
			columnFormat: { agendaWeek: 'ddd' },
			allDaySlot: false,
			year: 2013,
			month: 2,
			date: 3,
			minTime: '8:00am',
			maxTime: '8:00pm',
			contentHeight: 600,
			allDayDefault: false
		});
		
/*
		$('#results').html(function() {
			var result = ''
			$.each(validSectionCombinations, function(i, sections) {
				result += '<h3>Permutation '+(i+1)+'</h3><ul>';
				$.each(sections, function(i, section) {
					result += ['<li><a href="http:\/\/www.columbia.edu\/cu\/bulletin\/uwb\/subj\/', section['Course'].replace(/([A-Z]{4})([0-9]{4})([A-Z])([0-9]{3})/, "$1/$3$2-"+section['Term']+"-$4"), '" target="_blank">', section['CourseTitle'], ' (&sect;', section['Course'].slice(-3), ') (', section['CallNumber'], ')', '</a></li>'].join('');
				});
				result += '</ul>';
			});
			return result;
		});
*/
	}
	

	var API_TOKEN = '51314d99a237900002959a87';
	$(function() {
		$('#submit').click(function(ev) {
			var term = $('#term').val(),
			courseids = $('#courseids').val().split(','),
			jxhr = [],
			result = [];
		$.each(courseids, function(i, val) {
			jxhr.push(
				$.getJSON('http://data.adicu.com/courses?api_token='+API_TOKEN+'&term='+term+'&courseid='+val+'&jsonp=?', function(data) {
					data = data['data'];
					result.push(data);
					})
				);
		});
		$.when.apply($, jxhr).done(function() {
			parseArrayOfClassSections(result);
		});
		});


		var courseids = ["ACLSBC3997",
	"ACLSBC3998",
	"ACTUK4821",
	"ACTUK4823",
	"ACTUK4823",
	"ACTUK4830",
	"AMSTW3990",
	"ANTHG6212",
	"ANTHV3970",
	"ANTHV3993",
	"APMAE3102",
	"APMAE4101",
	"APMAE4204",
	"APMAE4300",
	"APMAE4301",
	"APMAE6301",
	"APPHE1300",
	"APPHE3100",
	"APPHE4010",
	"APPHE4018",
	"APPHE4100",
	"APPHE4130",
	"APPHE4200",
	"APPHE4210",
	"APPHE4300",
	"APPHE4301",
	"APPHE4330",
	"APPHE4600",
	"APPHE4710",
	"APPHE4711",
	"APPHE6081",
	"APPHE6101",
	"APPHE6102",
	"APPHE6319",
	"APPHE6330",
	"APPHE6333",
	"APPHE6335",
	"APPHE6340",
	"APPHE6365",
	"APPHE6380",
	"ARCHV3201",
	"ARCHV3202",
	"ARCHV3211",
	"AUMSO2025",
	"BENGW1201",
	"BENGW1202",
	"BINFG4002",
	"BINFG4052",
	"BIOCC3501",
	"BIOCW4501",
	"BIOLBC1500",
	"BIOLBC1501",
	"BIOLBC1501",
	"BIOLBC1502",
	"BIOLBC1503",
	"BIOLBC1503",
	"BIOLBC2100",
	"BIOLBC2100",
	"BIOLBC2240",
	"BIOLBC2262",
	"BIOLBC2272",
	"BIOLBC2278",
	"BIOLBC2280",
	"BIOLBC2286",
	"BIOLBC2801",
	"BIOLBC2841",
	"BIOLBC3303",
	"BIOLBC3310",
	"BIOLBC3311",
	"BIOLBC3320",
	"BIOLBC3360",
	"BIOLBC3362",
	"BIOLBC3363",
	"BIOLBC3590",
	"BIOLBC3590",
	"BIOLC2006",
	"BIOLC2006",
	"BIOLF2402",
	"BIOLG4013",
	"BIOLG4305",
	"BIOLS3368",
	"BIOLW3005",
	"BIOLW3006",
	"BIOLW3022",
	"BIOLW3031",
	"BIOLW3040",
	"BIOLW3041",
	"BIOLW3073",
	"BIOLW3310",
	"BIOLW4005",
	"BIOLW4022",
	"BIOLW4031",
	"BIOLW4073",
	"BIOLW4077",
	"BIOTW4201",
	"BISTP8100",
	"BISTP8100",
	"BISTP8100",
	"BISTP8104",
	"BISTP8108",
	"BISTP8109",
	"BISTP8110",
	"BISTP8116",
	"BISTP8120",
	"BISTP8120",
	"BISTP8121",
	"BISTP8157",
	"BISTP8157",
	"BISTP9109",
	"BMCHE3500",
	"BMEBW4020",
	"BMEEE6030",
	"BMENE3320",
	"BMENE4001",
	"BMENE4210",
	"BMENE4300",
	"BMENE4340",
	"BMENE4410",
	"BMENE4420",
	"BMENE4430",
	"BMENE4501",
	"BMENE4502",
	"BMENE4898",
	"BMENE6003",
	"BMENE6500",
	"BUSIK4003",
	"BUSIK4003",
	"BUSIK4003",
	"BUSIK4003",
	"BUSIK4003",
	"BUSIK4003",
	"BUSIK4008",
	"BUSIK4008",
	"BUSIK4025",
	"BUSIK4025",
	"BUSIK4040",
	"BUSIK4040",
	"BUSIK4040",
	"BUSIK4100",
	"BUSIK4100",
	"CANTW1201",
	"CANTW1202",
	"CATLW1201",
	"CATLW1201",
	"CHAPE4120",
	"CHEEE3010",
	"CHEEE3010",
	"CHEEE4530",
	"CHEEE6220",
	"CHEEE6252",
	"CHEMBC2002",
	"CHEMBC2002",
	"CHEMBC3230",
	"CHEMBC3231",
	"CHEMBC3252",
	"CHEMBC3271",
	"CHEMBC3333",
	"CHEMBC3335",
	"CHEMBC3337",
	"CHEMBC3342",
	"CHEMBC3342",
	"CHEMBC3355",
	"CHEMBC3357",
	"CHEMBC3357",
	"CHEMBC3365",
	"CHEMBC3368",
	"CHEMBC3597",
	"CHEMBC3597",
	"CHEMBC3597",
	"CHEMBC3597",
	"CHEMBC3597",
	"CHEMBC3597",
	"CHEMBC3597",
	"CHEMBC3597",
	"CHEMBC3597",
	"CHEMBC3597",
	"CHEMBC3597",
	"CHEMBC3597",
	"CHEMBC3598",
	"CHEMBC3598",
	"CHEMBC3599",
	"CHEMBC3599",
	"CHEMBC3599",
	"CHEMBC3599",
	"CHEMBC3599",
	"CHEMBC3599",
	"CHEMBC3599",
	"CHEMBC3599",
	"CHEMBC3599",
	"CHEMBC3599",
	"CHEMBC3599",
	"CHEMBC3599",
	"CHEMC1403",
	"CHEMC1403",
	"CHEMC1403",
	"CHEMC1404",
	"CHEMC1404",
	"CHEMC1404",
	"CHEMC1604",
	"CHEMC2408",
	"CHEMC3079",
	"CHEMC3079",
	"CHEMC3080",
	"CHEMC3081",
	"CHEMC3085",
	"CHEMC3086",
	"CHEMC3443",
	"CHEMC3443",
	"CHEMC3444",
	"CHEMC3444",
	"CHEMG6222",
	"CHEMG8149",
	"CHEMS1403",
	"CHEMS1403",
	"CHEMS1404",
	"CHEMS1404",
	"CHEMS3443",
	"CHEMS3443",
	"CHEMS3444",
	"CHEMS3444",
	"CHEMW1403",
	"CHEMW1404",
	"CHEMW2507",
	"CHEMW2507",
	"CHEMW2507",
	"CHEMW2507",
	"CHEMW3443",
	"CHEMW3444",
	"CHEMW3543",
	"CHEMW3543",
	"CHEMW3543",
	"CHEMW3543",
	"CHEMW3543",
	"CHEMW3543",
	"CHEMW3543",
	"CHEMW3543",
	"CHEMW3543",
	"CHEMW3543",
	"CHEMW3543",
	"CHEMW3543",
	"CHEMW3545",
	"CHEMW3545",
	"CHEMW3546",
	"CHEMW3546",
	"CHENE3120",
	"CHENE3210",
	"CHENE3220",
	"CHENE3810",
	"CHENE4140",
	"CHENE4140",
	"CHENE4230",
	"CHENE4300",
	"CHENE4300",
	"CHENE4330",
	"CHENE4400",
	"CHENE4500",
	"CHENE4500",
	"CHENE4510",
	"CHENE4540",
	"CHENE4610",
	"CHENE4800",
	"CHNSC1201",
	"CHNSC1201",
	"CHNSC1201",
	"CHNSC1201",
	"CHNSC1202",
	"CHNSC1202",
	"CHNSC1202",
	"CHNSC1202",
	"CHNSC1221",
	"CHNSC1222",
	"CHNSF1201",
	"CHNSF1202",
	"CHNSG5001",
	"CHNSG5017",
	"CHNSG5017",
	"CHNSW1011",
	"CHNSW1011",
	"CHNSW1011",
	"CHNSW3301",
	"CHNSW3302",
	"CHNSW4017",
	"CHNSW4017",
	"CIEEE3250",
	"CIEEE3255",
	"CIEEE4252",
	"CIENE3127",
	"CIENE3128",
	"CIENE3141",
	"CIENE3141",
	"CIENE4021",
	"CIENE4022",
	"CIENE4100",
	"CIENE4133",
	"CIENE4138",
	"CIENE4139",
	"CIENE4210",
	"CIENE4226",
	"CIENE4232",
	"CIENE4234",
	"CIENE4241",
	"CIENE4243",
	"CIENE4246",
	"COMMK4110",
	"COMMK4235",
	"COMSE6232",
	"COMSE6261",
	"COMSS1007",
	"COMSS3134",
	"COMSS3157",
	"COMSS3261",
	"COMSS4111",
	"COMSS4231",
	"COMSS4701",
	"COMSW3134",
	"COMSW3134",
	"COMSW3136",
	"COMSW3137",
	"COMSW3157",
	"COMSW3157",
	"COMSW3261",
	"COMSW3261",
	"COMSW4111",
	"COMSW4111",
	"COMSW4111",
	"COMSW4111",
	"COMSW4112",
	"COMSW4115",
	"COMSW4115",
	"COMSW4118",
	"COMSW4118",
	"COMSW4118",
	"COMSW4118",
	"COMSW4156",
	"COMSW4160",
	"COMSW4167",
	"COMSW4170",
	"COMSW4172",
	"COMSW4180",
	"COMSW4187",
	"COMSW4236",
	"COMSW4252",
	"COMSW4444",
	"COMSW4460",
	"COMSW4701",
	"COMSW4701",
	"COMSW4705",
	"COMSW4735",
	"CPLSBC3123",
	"CSEEE6824",
	"CSEEE6861",
	"CSEEW4140",
	"CSEEW4823",
	"CSEEW4840",
	"CSORW4231",
	"CZCHW1201",
	"CZCHW1202",
	"DNCEBC1247",
	"DNCEBC1446",
	"DNCEBC2143",
	"DNCEBC2143",
	"DNCEBC2248",
	"DNCEBC2249",
	"DNCEBC2253",
	"DNCEBC2253",
	"DNCEBC2447",
	"DNCEBC2447",
	"DNCEBC2452",
	"DNCEBC2452",
	"DNCEBC3200",
	"DNCEBC3249",
	"DTCHW1201",
	"DTCHW1202",
	"EAEEE3103",
	"EAEEE3800",
	"EAEEE3801",
	"EAEEE3901",
	"EAEEE4003",
	"EAEEE4006",
	"EAEEE4010",
	"EAEEE4200",
	"EAEEE4255",
	"EAEEE4257",
	"EAEEE4350",
	"EAEEE4550",
	"EAEEE4950",
	"EAEEE6150",
	"ECONBC2075",
	"ECONBC3011",
	"ECONBC3013",
	"ECONBC3017",
	"ECONBC3018",
	"ECONBC3018",
	"ECONBC3019",
	"ECONBC3029",
	"ECONBC3035",
	"ECONBC3035",
	"ECONBC3038",
	"ECONG4235",
	"ECONG4301",
	"ECONG4421",
	"ECONG4526",
	"ECONG4527",
	"ECONG6222",
	"ECONG6226",
	"ECONG6253",
	"ECONG6254",
	"ECONG6255",
	"ECONG6306",
	"ECONG6417",
	"ECONG6600",
	"ECONG6805",
	"ECONG6903",
	"ECONG6905",
	"ECONG6930",
	"ECONG8310",
	"ECONG8310",
	"ECONG8315",
	"ECONG8315",
	"ECONG8712",
	"ECONG8712",
	"ECONG8713",
	"ECONG8713",
	"ECONG8714",
	"ECONG8714",
	"ECONG8718",
	"ECONG8718",
	"ECONS3025",
	"ECONS3211",
	"ECONS3213",
	"ECONS3412",
	"ECONS4415",
	"ECONS4500",
	"ECONV3265",
	"ECONV3265",
	"ECONW2257",
	"ECONW3211",
	"ECONW3211",
	"ECONW3211",
	"ECONW3211",
	"ECONW3211",
	"ECONW3211",
	"ECONW3211",
	"ECONW3213",
	"ECONW3213",
	"ECONW3213",
	"ECONW3213",
	"ECONW3213",
	"ECONW3412",
	"ECONW3412",
	"ECONW3412",
	"ECONW3412",
	"ECONW3412",
	"ECONW4020",
	"ECONW4211",
	"ECONW4213",
	"ECONW4228",
	"ECONW4251",
	"ECONW4280",
	"ECONW4280",
	"ECONW4280",
	"ECONW4280",
	"ECONW4321",
	"ECONW4325",
	"ECONW4370",
	"ECONW4412",
	"ECONW4413",
	"ECONW4415",
	"ECONW4438",
	"ECONW4465",
	"ECONW4480",
	"ECONW4500",
	"ECONW4505",
	"ECONW4615",
	"ECONW4625",
	"ECONW4750",
	"ECONW4911",
	"ECONW4911",
	"ECONW4911",
	"ECONW4911",
	"ECONW4911",
	"ECONW4911",
	"ECONW4911",
	"ECONW4913",
	"ECONW4913",
	"ECONW4913",
	"ECONW4913",
	"ECONW4913",
	"ECONW4913",
	"ECONW4913",
	"ECONW4913",
	"ECONW4918",
	"ECONW4918",
	"ECONW4999",
	"ECONW4999",
	"ECPHW4950",
	"EDUCBC3063",
	"EDUCBC3063",
	"EEBME6020",
	"EECSE4340",
	"EEEBW2002",
	"EEEBW3208",
	"EEEBW3220",
	"EEEBW3230",
	"EEEBW4122",
	"EEEBW4195",
	"EEMEE3601",
	"EEMEE4601",
	"EEMEE6601",
	"EESCBC3017",
	"EESCW4300",
	"EESCW4404",
	"EESCW4924",
	"EESCW4949",
	"ELENE1201",
	"ELENE1201",
	"ELENE3043",
	"ELENE3081",
	"ELENE3081",
	"ELENE3081",
	"ELENE3083",
	"ELENE3083",
	"ELENE3083",
	"ELENE3106",
	"ELENE3201",
	"ELENE3331",
	"ELENE3390",
	"ELENE3401",
	"ELENE3701",
	"ELENE4301",
	"ELENE4312",
	"ELENE4314",
	"ELENE4401",
	"ELENE4411",
	"ELENE4488",
	"ELENE4511",
	"ELENE4702",
	"ELENE4703",
	"ELENE4810",
	"ELENE4815",
	"ELENE4835",
	"ELENE4896",
	"ELENE6010",
	"ELENE6302",
	"ELENE6312",
	"ELENE6316",
	"ELENE6318",
	"ELENE6320",
	"ELENE6321",
	"ELENE6331",
	"ELENE6412",
	"ELENE6488",
	"ELENE6761",
	"ELENE6873",
	"ELENE6880",
	"ELENE6884",
	"ELENE6885",
	"ELENE6886",
	"ELENE6888",
	"ELENE6945",
	"ELENE6951",
	"EMPAU6017",
	"EMPAU6018",
	"ENGLW3001",
	"ENGLW3001",
	"ENMEE3105",
	"ENMEE3105",
	"ENMEE3106",
	"ENMEE3113",
	"ENMEE3114",
	"ENMEE3161",
	"ENMEE3161",
	"ENMEE6220",
	"FILMBC3119",
	"FILMBC3119",
	"FILMBC3120",
	"FILMBC3200",
	"FILMBC3200",
	"FILMBC3301",
	"FILMR4005",
	"FILMR4016",
	"FILMR4440",
	"FILMW3005",
	"FILMW3005",
	"FILMW3005",
	"FILMW3051",
	"FILMW3054",
	"FILMW3054",
	"FILMW3054",
	"FILMW3200",
	"FILMW3202",
	"FILMW3300",
	"FILMW3842",
	"FILMW3850",
	"FILMW4098",
	"FILMW4099",
	"FILMW4145",
	"FILMW4145",
	"FINNW1201",
	"FINNW1202",
	"FRENBC1203",
	"FRENBC1203",
	"FRENBC1203",
	"FRENBC1203",
	"FRENBC1203",
	"FRENBC1203",
	"FRENBC1203",
	"FRENBC1203",
	"FRENBC1203",
	"FRENBC1204",
	"FRENBC1204",
	"FRENBC1204",
	"FRENBC1204",
	"FRENBC1204",
	"FRENBC1204",
	"FRENBC1204",
	"FRENBC1204",
	"FRENBC1204",
	"FRENBC1204",
	"FRENBC3035",
	"FRENBC3036",
	"FRENW3405",
	"FRENW3405",
	"FRENW3405",
	"FRENW3405",
	"FRENW3405",
	"FRENW3405",
	"FRENW3405",
	"FRENW3544",
	"FRENW3600",
	"FRENW3995",
	"GERMBC3010",
	"GERMBC3050",
	"GERMF1114",
	"GERMS1201",
	"GERMS1202",
	"GERMV1102",
	"GERMV1102",
	"GERMV1102",
	"GERMV1102",
	"GERMV1102",
	"GERMV1102",
	"GERMV1102",
	"GERMV1102",
	"GERMV1201",
	"GERMV1201",
	"GERMV1201",
	"GERMV1201",
	"GERMV1201",
	"GERMV1201",
	"GERMV1201",
	"GERMV1201",
	"GERMV1202",
	"GERMV1202",
	"GERMV1202",
	"GERMV1202",
	"GERMV1202",
	"GERMV1202",
	"GERMV1225",
	"GERMV3001",
	"GERMV3002",
	"GERMW1521",
	"GERMW1521",
	"GERMW1522",
	"GERMW1522",
	"GERMW3333",
	"GRAPE3115",
	"GREKV1101",
	"GREKV1101",
	"GREKV1102",
	"GREKV1102",
	"GREKV1201",
	"GREKV1202",
	"GREKV3310",
	"GREKW4009",
	"GREKW4010",
	"GREKW4105",
	"GRKMV1102",
	"GRKMV1201",
	"GRKMV1202",
	"GRKMV3306",
	"HNGRW1201",
	"HNGRW1202",
	"HNGRW3340",
	"HSEAG8880",
	"HSEAW4893",
	"IEORE2261",
	"IEORE2261",
	"IEORE3106",
	"IEORE3106",
	"IEORE3402",
	"IEORE3402",
	"IEORE3608",
	"IEORE3608",
	"IEORE3608",
	"IEORE4000",
	"IEORE4000",
	"IEORE4001",
	"IEORE4003",
	"IEORE4007",
	"IEORE4007",
	"IEORE4106",
	"IEORE4106",
	"IEORE4106",
	"IEORE4106",
	"IEORE4111",
	"IEORE4111",
	"IEORE4208",
	"IEORE4403",
	"IEORE4404",
	"IEORE4404",
	"IEORE4404",
	"IEORE4404",
	"IEORE4404",
	"IEORE4404",
	"IEORE4405",
	"IEORE4407",
	"IEORE4407",
	"IEORE4408",
	"IEORE4408",
	"IEORE4412",
	"IEORE4505",
	"IEORE4507",
	"IEORE4510",
	"IEORE4550",
	"IEORE4601",
	"IEORE4601",
	"IEORE4602",
	"IEORE4602",
	"IEORE4611",
	"IEORE4615",
	"IEORE4615",
	"IEORE4620",
	"IEORE4630",
	"IEORE4630",
	"IEORE4700",
	"IEORE4700",
	"IEORE4700",
	"IEORE4700",
	"IEORE4703",
	"IEORE4705",
	"IEORE4705",
	"IEORE4706",
	"IEORE4707",
	"IEORE4710",
	"IEORE4718",
	"IEORE4726",
	"IEORE4729",
	"INAFU6017",
	"INAFU6017",
	"INAFU6017",
	"INAFU6017",
	"INAFU6018",
	"INAFU6018",
	"INAFU6018",
	"INAFU6018",
	"INAFU6039",
	"INAFU6039",
	"INAFU6054",
	"INAFU6057",
	"INAFU6301",
	"INAFU6301",
	"INAFU6301",
	"INAFU6301",
	"INAFU6301",
	"INAFU6301",
	"INAFU6355",
	"INAFU8145",
	"INAFU8145",
	"INAFU8145",
	"INAFU8145",
	"INAFU8211",
	"INAFU8454",
	"INAFU8682",
	"INDOW1201",
	"INDOW1202",
	"IRSHW1201",
	"IRSHW1202",
	"ITALS1102",
	"ITALV1102",
	"ITALV1102",
	"ITALV1102",
	"ITALV1102",
	"ITALV1102",
	"ITALV1102",
	"ITALV1201",
	"ITALV1201",
	"ITALV1201",
	"ITALV1201",
	"ITALV1202",
	"ITALV1202",
	"ITALV1202",
	"ITALV1202",
	"ITALV1203",
	"ITALV1203",
	"ITALV3333",
	"ITALV3334",
	"ITALV3335",
	"ITALV3335",
	"ITALV3336",
	"ITALW1201",
	"ITALW1201",
	"ITALW1201",
	"ITALW1201",
	"ITALW1202",
	"ITALW1202",
	"ITALW1202",
	"ITALW1202",
	"ITALW1221",
	"ITALW1222",
	"ITALW1311",
	"ITALW1312",
	"JPNSG9020",
	"JPNSG9040",
	"JPNSW4007",
	"JPNSW4019",
	"KORNG8010",
	"KORNW1201",
	"KORNW1201",
	"KORNW1202",
	"KORNW1202",
	"KORNW4005",
	"KORNW4006",
	"KORNW4105",
	"KORNW4106",
	"LANDK4103",
	"LATNV1101",
	"LATNV1101",
	"LATNV1101",
	"LATNV1101",
	"LATNV1102",
	"LATNV1102",
	"LATNV1102",
	"LATNV1201",
	"LATNV1201",
	"LATNV1201",
	"LATNV1202",
	"LATNV1202",
	"LATNV1202",
	"LATNV3012",
	"LATNV3309",
	"LATNV3310",
	"LATNW4009",
	"LATNW4010",
	"LATNW4105",
	"LATNW4106",
	"LINGW4108",
	"LINGW4202",
	"LINGW4376",
	"MATHE1210",
	"MATHE1210",
	"MATHE1210",
	"MATHE1210",
	"MATHS1101",
	"MATHS1101",
	"MATHS1101",
	"MATHS1102",
	"MATHS1102",
	"MATHS1201",
	"MATHS1201",
	"MATHS1202",
	"MATHS1202",
	"MATHS2010",
	"MATHS2010",
	"MATHS2010",
	"MATHS2500",
	"MATHS3027",
	"MATHS3027",
	"MATHS4061",
	"MATHS4061",
	"MATHS4062",
	"MATHV1102",
	"MATHV1102",
	"MATHV1102",
	"MATHV1102",
	"MATHV1102",
	"MATHV1102",
	"MATHV1102",
	"MATHV1102",
	"MATHV1102",
	"MATHV1102",
	"MATHV1102",
	"MATHV1102",
	"MATHV1102",
	"MATHV1201",
	"MATHV1201",
	"MATHV1201",
	"MATHV1201",
	"MATHV1201",
	"MATHV1201",
	"MATHV1201",
	"MATHV1201",
	"MATHV1201",
	"MATHV1201",
	"MATHV1201",
	"MATHV1201",
	"MATHV1201",
	"MATHV1201",
	"MATHV1201",
	"MATHV1201",
	"MATHV1201",
	"MATHV1201",
	"MATHV1202",
	"MATHV1202",
	"MATHV1202",
	"MATHV1202",
	"MATHV1202",
	"MATHV1202",
	"MATHV1202",
	"MATHV1202",
	"MATHV2010",
	"MATHV2010",
	"MATHV2010",
	"MATHV2010",
	"MATHV2010",
	"MATHV2010",
	"MATHV2020",
	"MATHV2500",
	"MATHV2500",
	"MATHV2500",
	"MATHV3007",
	"MATHV3027",
	"MATHV3028",
	"MATHV3050",
	"MATHV3386",
	"MATHW4041",
	"MATHW4041",
	"MATHW4042",
	"MATHW4042",
	"MATHW4043",
	"MATHW4044",
	"MATHW4051",
	"MATHW4052",
	"MATHW4053",
	"MATHW4065",
	"MATHW4071",
	"MATHW4081",
	"MATHW4155",
	"MATHW4391",
	"MATHW4392",
	"MDESS1211",
	"MDESS1211",
	"MDESS1211",
	"MDESS1214",
	"MDESS1214",
	"MDESS1215",
	"MDESS1215",
	"MDESW1201",
	"MDESW1202",
	"MDESW1214",
	"MDESW1214",
	"MDESW1214",
	"MDESW1214",
	"MDESW1215",
	"MDESW1215",
	"MDESW1215",
	"MDESW1215",
	"MDESW1312",
	"MDESW1313",
	"MDESW1511",
	"MDESW1511",
	"MDESW1512",
	"MDESW1512",
	"MDESW1513",
	"MDESW1513",
	"MDESW1513",
	"MDESW1612",
	"MDESW1612",
	"MDESW1613",
	"MDESW1613",
	"MDESW1712",
	"MDESW1713",
	"MDESW4213",
	"MDESW4214",
	"MDESW4510",
	"MDESW4511",
	"MDESW4610",
	"MDESW4636",
	"MEBME4439",
	"MECEE3100",
	"MECEE3100",
	"MECEE3100",
	"MECEE3100",
	"MECEE3401",
	"MECEE3409",
	"MECEE3430",
	"MECEE3430",
	"MECEE3610",
	"MECEE4058",
	"MECEE4058",
	"MECEE4100",
	"MECEE4211",
	"MECEE4302",
	"MECEE4305",
	"MECEE4306",
	"MECEE4312",
	"MECEE4314",
	"MECEE4404",
	"MECEE4501",
	"MECEE4502",
	"MECEE6100",
	"MECEE6104",
	"MECEE6313",
	"MECEE6400",
	"MECEE6432",
	"MSAEE3103",
	"MSAEE3141",
	"MSAEE3142",
	"MSAEE4101",
	"MSAEE4206",
	"MSAEE4215",
	"MUSIG4360",
	"MUSIG6610",
	"MUSIG6611",
	"MUSIV2025",
	"MUSIV2145",
	"MUSIV2205",
	"MUSIV2318",
	"MUSIV2318",
	"MUSIV2318",
	"MUSIV2319",
	"MUSIV2319",
	"MUSIV2319",
	"MUSIV3241",
	"MUSIV3305",
	"MUSIV3321",
	"MUSIV3321",
	"MUSIV3321",
	"MUSIV3322",
	"MUSIV3322",
	"MUSIV3322",
	"MUSIV3420",
	"MUSIW1515",
	"MUSIW1515",
	"MUSIW1516",
	"MUSIW1516",
	"MUSIW2515",
	"MUSIW2515",
	"MUSIW2515",
	"MUSIW2516",
	"MUSIW2516",
	"MUSIW2516",
	"MUSIW3515",
	"MUSIW3515",
	"MUSIW3515",
	"MUSIW3516",
	"MUSIW3516",
	"MUSIW3516",
	"MUSIW4242",
	"MUSIW4626",
	"PATHG6004",
	"PHARG8001",
	"PHILG4455",
	"PHYSBC2002",
	"PHYSBC2002",
	"PHYSBC2002",
	"PHYSBC3001",
	"PHYSBC3001",
	"PHYSBC3001",
	"PHYSBC3006",
	"PHYSC1402",
	"PHYSC1402",
	"PHYSC1403",
	"PHYSC1493",
	"PHYSC1493",
	"PHYSC1493",
	"PHYSC1493",
	"PHYSC1493",
	"PHYSC1493",
	"PHYSC1493",
	"PHYSC1493",
	"PHYSC1493",
	"PHYSC1493",
	"PHYSC1493",
	"PHYSC1493",
	"PHYSC1494",
	"PHYSC1494",
	"PHYSC1494",
	"PHYSC1494",
	"PHYSC1494",
	"PHYSC1494",
	"PHYSC1494",
	"PHYSC1494",
	"PHYSC1494",
	"PHYSC1602",
	"PHYSC2601",
	"PHYSC2699",
	"PHYSC2699",
	"PHYSC2699",
	"PHYSC2699",
	"PHYSC2699",
	"PHYSC2699",
	"PHYSC2699",
	"PHYSC2699",
	"PHYSC2699",
	"PHYSF1201",
	"PHYSF1202",
	"PHYSG4003",
	"PHYSG4011",
	"PHYSG4018",
	"PHYSG4021",
	"PHYSG4022",
	"PHYSG4023",
	"PHYSG4040",
	"PHYSG6010",
	"PHYSG6036",
	"PHYSG6037",
	"PHYSG6038",
	"PHYSG6082",
	"PHYSG6092",
	"PHYSG6094",
	"PHYSG8048",
	"PHYSG8069",
	"PHYSS1202",
	"PHYSS1291",
	"PHYSS1292",
	"PHYSS1292",
	"POLIW1201",
	"POLIW1202",
	"POLSBC3055",
	"POLSBC3101",
	"POLSBC3254",
	"POLSBC3331",
	"POLSBC3332",
	"POLSBC3500",
	"POLSBC3521",
	"POLSBC3805",
	"POLSBC3810",
	"POLSW3215",
	"POLSW3215",
	"POLSW3322",
	"POLSW3921",
	"POLSW3921",
	"POLSW3921",
	"POLSW3921",
	"POLSW3921",
	"POLSW3921",
	"POLSW3921",
	"POLSW3921",
	"POLSW3922",
	"POLSW3922",
	"POLSW3922",
	"POLSW3922",
	"POLSW3922",
	"POLSW3922",
	"POLSW3922",
	"POLSW3922",
	"POLSW3951",
	"POLSW3951",
	"POLSW3951",
	"POLSW3952",
	"POLSW3952",
	"POLSW3952",
	"POLSW3961",
	"POLSW3961",
	"POLSW3961",
	"POLSW3961",
	"POLSW3961",
	"POLSW3961",
	"POLSW3962",
	"POLSW3962",
	"POLSW3962",
	"POLSW3962",
	"POLSW4210",
	"POLSW4401",
	"POLSW4406",
	"POLSW4445",
	"POLSW4496",
	"POLSW4911",
	"PORTW1102",
	"PORTW1102",
	"PORTW1220",
	"PORTW1220",
	"PORTW1220",
	"PORTW1220",
	"PORTW3101",
	"PORTW3301",
	"PSYCBC1099",
	"PSYCBC1099",
	"PSYCBC1101",
	"PSYCBC1101",
	"PSYCBC1101",
	"PSYCBC1101",
	"PSYCBC1102",
	"PSYCBC1102",
	"PSYCBC1102",
	"PSYCBC1102",
	"PSYCBC1102",
	"PSYCBC1102",
	"PSYCBC1102",
	"PSYCBC1102",
	"PSYCBC1102",
	"PSYCBC1102",
	"PSYCBC1102",
	"PSYCBC1102",
	"PSYCBC1106",
	"PSYCBC1106",
	"PSYCBC1106",
	"PSYCBC1107",
	"PSYCBC1109",
	"PSYCBC1109",
	"PSYCBC1109",
	"PSYCBC1110",
	"PSYCBC1114",
	"PSYCBC1114",
	"PSYCBC1114",
	"PSYCBC1115",
	"PSYCBC1118",
	"PSYCBC1118",
	"PSYCBC1118",
	"PSYCBC1119",
	"PSYCBC1124",
	"PSYCBC1124",
	"PSYCBC1125",
	"PSYCBC1128",
	"PSYCBC1128",
	"PSYCBC1128",
	"PSYCBC1128",
	"PSYCBC1129",
	"PSYCBC1129",
	"PSYCBC1137",
	"PSYCBC1137",
	"PSYCBC1138",
	"PSYCBC2134",
	"PSYCBC2141",
	"PSYCBC2141",
	"PSYCBC2151",
	"PSYCBC2154",
	"PSYCBC2156",
	"PSYCBC2177",
	"PSYCBC3152",
	"PSYCBC3155",
	"PSYCBC3158",
	"PSYCBC3162",
	"PSYCBC3368",
	"PSYCBC3373",
	"PSYCBC3376",
	"PSYCBC3376",
	"PSYCBC3379",
	"PSYCBC3379",
	"PSYCBC3382",
	"PSYCBC3383",
	"PSYCBC3384",
	"PSYCBC3387",
	"PSYCBC3387",
	"PSYCBC3390",
	"PSYCBC3393",
	"PSYCBC3465",
	"PSYCBC3466",
	"PSYCBC3591",
	"PSYCBC3592",
	"PSYCG4485",
	"PSYCG4492",
	"PSYCG4498",
	"PSYCG4499",
	"PSYCG4685",
	"PSYCS1610",
	"PSYCS2280",
	"PSYCS2620",
	"PSYCS3285",
	"PSYCS3410",
	"PSYCW1420",
	"PSYCW1450",
	"PSYCW1610",
	"PSYCW1610",
	"PSYCW2220",
	"PSYCW2230",
	"PSYCW2250",
	"PSYCW2280",
	"PSYCW2420",
	"PSYCW2440",
	"PSYCW2460",
	"PSYCW3225",
	"PSYCW3290",
	"PSYCW3440",
	"PSYCW3450",
	"PSYCW3615",
	"PSYCW3625",
	"PSYCW3680",
	"PUNJW1201",
	"PUNJW1202",
	"QMSSG4014",
	"RUSSV1201",
	"RUSSV1201",
	"RUSSV1201",
	"RUSSV1202",
	"RUSSV1202",
	"RUSSV3101",
	"RUSSV3101",
	"RUSSV3102",
	"RUSSV3102",
	"SCRBW1201",
	"SCRBW1202",
	"SIEOW4150",
	"SIEOW4150",
	"SIEOW4150",
	"SIPAU4011",
	"SIPAU4011",
	"SIPAU4011",
	"SIPAU8500",
	"SOCIW3010",
	"SOCIW3010",
	"SOSCP8789",
	"SOSCP9740",
	"SPANS1102",
	"SPANS1102",
	"SPANS1201",
	"SPANS1201",
	"SPANS1201",
	"SPANS1201",
	"SPANS1202",
	"SPANS1202",
	"SPANS1202",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1201",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1202",
	"SPANW1220",
	"SPANW1220",
	"SPANW1220",
	"SPANW1220",
	"SPANW3563",
	"SPANW4415",
	"STATG6102",
	"STATG6106",
	"STATG6240",
	"STATG6503",
	"STATG6503",
	"STATG6505",
	"STATG6505",
	"STATG6505",
	"STATG8243",
	"STATG8243",
	"STATG8325",
	"STATG8325",
	"STATG8325",
	"STATG8325",
	"STATG8325",
	"STATG8325",
	"STATS4105",
	"STATW2024",
	"STATW2025",
	"STATW2026",
	"STATW3051",
	"STATW3103",
	"STATW3105",
	"STATW3107",
	"STATW4105",
	"STATW4105",
	"STATW4107",
	"STATW4107",
	"STATW4109",
	"STATW4109",
	"STATW4109",
	"STATW4109",
	"STATW4201",
	"STATW4201",
	"STATW4201",
	"STATW4240",
	"STATW4290",
	"STATW4315",
	"STATW4315",
	"STATW4315",
	"STATW4315",
	"STATW4315",
	"STATW4325",
	"STATW4335",
	"STATW4413",
	"STATW4415",
	"STATW4437",
	"STATW4437",
	"STATW4437",
	"STATW4440",
	"STATW4543",
	"STATW4606",
	"STATW4606",
	"STATW4635",
	"STATW4840",
	"SWHLW3335",
	"SWHLW3336",
	"TAGAW1201",
	"TAGAW1202",
	"UKRNW1201",
	"UKRNW1202",
	"UKRNW4001",
	"UKRNW4002",
	"VIARR3021",
	"VIARR3201",
	"VIARR3201",
	"VIARR3201",
	"VIARR3201",
	"VIARR3202",
	"VIARR3210",
	"VIARR3220",
	"VIARR3332",
	"VIARR3402",
	"VIARR3402",
	"VIARR3412",
	"VIARR3414",
	"VIARR3416",
	"VIARR3420",
	"VIARR3702",
	"VIARR4510",
	"VIARR4702",
	"WLOFW1201",
	"WLOFW1202",
	"YIDDW1201",
	"YIDDW1202",
	"YIDDW1202",
	"ZULUW1201",
	"ZULUW1202"
		];
	function split( val ) {
		return val.split( /,\s*/ );
	}
	function extractLast( term ) {
		return split( term ).pop();
	}

	$( "#courseids" )
		// don't navigate away from the field on tab when selecting an item
		.bind( "keydown", function( event ) {
			if ( event.keyCode === $.ui.keyCode.TAB &&
				$( this ).data( "ui-autocomplete" ).menu.active ) {
				event.preventDefault();
			}
		})
	.autocomplete({
		minLength: 0,
		source: function( request, response ) {
			// delegate back to autocomplete, but extract the last term
			response( $.ui.autocomplete.filter(
					courseids, extractLast( request.term ) ) );
		},
		focus: function() {
			       // prevent value inserted on focus
			       return false;
		       },
		select: function( event, ui ) {
				var terms = split( this.value );
				// remove the current input
				terms.pop();
				// add the selected item
				terms.push( ui.item.value );
				// add placeholder to get the comma-and-space at the end
				terms.push( "" );
				this.value = terms.join( ", " );
				return false;
			}
	});
	});


})(jQuery, this);
