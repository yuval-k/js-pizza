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

function solve(names, toppings, amounts,
    modulo, all_edible_orig) {
    /*
    modulo - int
    names - list
    toppings - list
    amounts - dict {name: set([int])}
    all_edible - set([(name, topping)])
    */
    if ((modulo % 8 != 0) && (8 % modulo != 0))
        throw "Bad value for modulo";
    
    all_edible = new Array();
    for (ind in all_edible_orig) {
        nameAndTopping = all_edible_orig[ind];
        all_edible.push(getVarFor(nameAndTopping[0], nameAndTopping[1]));
    }
    // check that total sum of amounts is possible at all
    minSum = 0;
    maxSum = 0;
    for (nm in amounts) {
        minSum += Math.min.apply(null, amounts[nm])    
        maxSum += Math.max.apply(null, amounts[nm])    
    }
    var sumGood = false;
    for(a in range(minSum, maxSum)) {
        if( a % 8 == 0){
            sumGood = true;
            break;
        }
    }
    if(!sumGood)
        throw "Slices don't make up a pizza!";


    problem = csp.DiscreteProblem();
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
    sumModuloConstraint = function() {
       return doSum.apply(null, arguments) % this == 0;
    }.bind(8);
    problem.addConstraint(all_edible, sumModuloConstraint);
    
    var res = problem.getSolutions();
    var r = []
    
    for (ind in res) {
        var tmpD = [];
        for (k in res[ind]) {
            tmpD.push([getNTForVar(k), res[ind][k]]);
        }
        r.push(tmpD);   
    }
    
    return r;
}

return {solve: solve};
}

define('solver',['csp'], solverModule);

