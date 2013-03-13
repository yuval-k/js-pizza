// original python version:
// https://launchpad.net/pyzza

/*
    modulo - int
    names - list
    toppings - list
    amounts - dict {name: set([int])}
    all_edible - set([(name, topping)])
    
*/

require.config({
  baseUrl: "csp"
});

  
function solverModule(csp) {
    
SLICES_IN_PIZZA = 8;


function rangeTo(max) {
    return range(0, max);
}

function range(min, max) {
    var r = [];
    for (i = min; i <= max; ++i) {
        r.push(i);
    }
    return r;
}

function doSum() {
    var sum = 0;
    for (a in arguments) {
        sum += arguments[a];
    }
    return sum;
}

function getVarFor(n,t) {
    return n + ";" + t;   
}

function getNTForVar(v) {
    return v.split(";");   
}

function compareArrays(a1,a2) {
 
    if (a1.length != a2.length) 
        return false;
    
    for(i = 0; i < a1.length; ++i) {
        if (a1[i] != a2[i])
            return false;
    }
    return true;
}

function validate(names, toppings, amounts, modulo, all_edible_orig) {
    if ((modulo % SLICES_IN_PIZZA != 0) && (SLICES_IN_PIZZA % modulo != 0))
        throw new Error("Bad value for modulo");
    
    // check that total sum of amounts is possible at all
    minSum = 0;
    maxSum = 0;
    for (nm in amounts) {
        minSum += Math.min.apply(null, amounts[nm])    
        maxSum += Math.max.apply(null, amounts[nm])    
    }
    var sumGood = false;
    minToMax = range(minSum, maxSum);
    for(ind in minToMax) {
        var a = minToMax[ind];
        // make sure that we can fit a pizza within all the slices
        if( a % SLICES_IN_PIZZA == 0){
            sumGood = true;
            break;
        }
    }
    if(!sumGood)
        throw new Error("Slices don't make up a pizza!");
}

function convertEdiblesCauseJsIsStupid(all_edible_orig) {
    // js sucks, so I need to convert this data struct to a list of strings,
    // that can be used as dictoinary keys.
    var all_edible = new Array();
    for (ind in all_edible_orig) {
        nameAndTopping = all_edible_orig[ind];
        all_edible.push(getVarFor(nameAndTopping[0], nameAndTopping[1]));
    }
    return all_edible;
}
   
function addVariables(problem, names, toppings, all_edible) {
    var name_vars = {};
    for( ind in names) {
        var n = names[ind];
        var listOfToppingsPerName = [];
        for(indt in toppings) {
            var t = toppings[indt]
            var v = getVarFor(n,t);
            if (all_edible.indexOf(v) != -1) {
             listOfToppingsPerName.push(v);
            }
        }
        name_vars[n] = listOfToppingsPerName;
        var domain = rangeTo(Math.max.apply(null,amounts[n]));
        for (indt in listOfToppingsPerName) {
            var v = listOfToppingsPerName[indt];
            problem.addVariable(v, domain);
        }
    }
    return name_vars;
}

function addPeopleConstraints(problem, names, name_vars,amounts) {
    for (ind in names) {
        var n = names[ind];
        var nameAmounts = amounts[n];
        nameAmounts.sort();
        if (nameAmounts.length == 1) {
            // fixed amount (2)
            var a = nameAmounts[0];
            var exactSum = function() {
                return doSum.apply(null, arguments) == this;
            }.bind(a);
            exactSum.name = "exactSum";
            problem.addConstraint(name_vars[n], exactSum)
        } else {
            var low = Math.min.apply(null, amounts[n])
            var high = Math.max.apply(null, amounts[n])

            if (compareArrays(nameAmounts, range(low, high))){
                // sequential range (1,2,3)
                minSum = function() {return doSum.apply(null, arguments) >= this}.bind(low);
                minSum.name = "minSum";
                maxSum = function() {return doSum.apply(null, arguments) <= this}.bind(high);
                maxSum.name = "maxSum";
                problem.addConstraint(name_vars[n], minSum)
                problem.addConstraint(name_vars[n], maxSum)
            } else {
                // has holes (1,3)
                sumInSet = function() {return this.indexOf(doSum.apply(null, arguments)) != -1}.bind(nameAmounts);
                sumInSet.name = "sumInSet";
                problem.addConstraint(name_vars[n], sumInSet) 
            }
        }
    }
}

function addToppingConstraints(problem, names, toppings, modulo, all_edible) {
    for(indt in toppings) {
        var t = toppings[indt]
        tvars = new Array();
        for (indn in names) {
            var n = names[indn];
            var v = getVarFor(n, t);
            if (all_edible.indexOf(v) != -1) {
                tvars.push(v);
            }
        }
        sumModuloConstraint = function() {
            return doSum.apply(null, arguments) % this == 0;
        }.bind(modulo);
        sumModuloConstraint.name = "sumModuloConstraint";
        problem.addConstraint(tvars, sumModuloConstraint);
    }
}

function addCreateAWholePizzaConstraint(all_edible) {
    sumModuloConstraint = function() {
       return doSum.apply(null, arguments) % this == 0;
    }.bind(SLICES_IN_PIZZA);
    problem.addConstraint(all_edible, sumModuloConstraint);
}

function parseResults(res) {
    var r = []
    
    for (ind in res) {
        var tmpD = [];
        for (k in res[ind]) {
            // unconvert the strings to the original [name, topping] pair
            tmpD.push([getNTForVar(k), res[ind][k]]);
        }
        r.push(tmpD);   
    }
    return r;    
}

function solve(names, toppings, amounts, modulo, all_edible_orig) {
    /*
    modulo - int
    names - list
    toppings - list
    amounts - dict {name: set([int])}
    all_edible - set([(name, topping)])
    */
  
    validate(names, toppings, amounts, modulo, all_edible_orig);
    
    var all_edible = convertEdiblesCauseJsIsStupid(all_edible_orig);
    

    problem = csp.DiscreteProblem();
    var name_vars = addVariables(problem, names, toppings, all_edible);
 
    addPeopleConstraints(problem, names, name_vars,amounts);
    addToppingConstraints(problem, names, toppings, modulo, all_edible);

    addCreateAWholePizzaConstraint(all_edible);

    var res = problem.getSolutions();

    return parseResults(res);
}

function getSlicesFromRes(res){
    var slices = {};
    for (ind2 in res) {
        var record = res[ind2];
        k = record[0];
        var name = k[0];
        var topping = k[1];
        amnt = record[1];

        if (slices[topping]) {
            slices[topping] += amnt;
        } else {
            slices[topping] = amnt;
        }

    }
    return slices;
}

function putInRecords(records, slices, record) {
    // now the slices is full!
    // save the all the records that lead to the same slices in the same place.
   for (i = 0; i < records.length; ++i) {
        sl = records[i][0];
        var wasFound = true;
        for (k in sl) {
            if (sl[k] != slices[k]) {
                wasFound = false;
                break;
            }
        }
        if (wasFound) {
            records[i][1].push(record);
            return true;
        }
    }
    // not found, push it clean..
    records.push([slices, [res]]);
    return false;
}

function parseToRecords(r) {
    var records = [];
        for (ind in r) {
            res = r[ind];
            slices = getSlicesFromRes(res);
            putInRecords(records, slices, res);
        }

    return records;
}

return {solve: solve, parseToRecords: parseToRecords};
}

define('solver',['csp'], solverModule);

