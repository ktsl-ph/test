// WHO Weight-for-age percentile data (LMS method)
// L = Box-Cox power, M = median, S = coefficient of variation
// Data simplified for key ages (0-24 months)

const WHO_WEIGHT_DATA = {
    male: [
        // Age (months), L, M, S
        [0, 0.3487, 3.3464, 0.14602],
        [1, 0.2297, 4.4709, 0.13395],
        [2, 0.1970, 5.5675, 0.12385],
        [3, 0.1738, 6.3762, 0.11727],
        [4, 0.1553, 7.0023, 0.11316],
        [5, 0.1395, 7.5105, 0.11080],
        [6, 0.1257, 7.9340, 0.10958],
        [7, 0.1134, 8.2970, 0.10902],
        [8, 0.1021, 8.6151, 0.10882],
        [9, 0.0917, 8.9014, 0.10881],
        [10, 0.0820, 9.1649, 0.10891],
        [11, 0.0730, 9.4122, 0.10906],
        [12, 0.0644, 9.6479, 0.10925],
        [15, 0.0424, 10.3002, 0.10986],
        [18, 0.0204, 10.9302, 0.11063],
        [21, -0.0021, 11.5490, 0.11154],
        [24, -0.0251, 12.1515, 0.11260]
    ],
    female: [
        // Age (months), L, M, S
        [0, 0.3809, 3.2322, 0.14171],
        [1, 0.1233, 4.1873, 0.13724],
        [2, 0.0422, 5.1282, 0.13000],
        [3, -0.0134, 5.8458, 0.12619],
        [4, -0.0553, 6.4237, 0.12402],
        [5, -0.0903, 6.8985, 0.12274],
        [6, -0.1201, 7.2970, 0.12204],
        [7, -0.1462, 7.6422, 0.12178],
        [8, -0.1695, 7.9487, 0.12181],
        [9, -0.1909, 8.2254, 0.12199],
        [10, -0.2111, 8.4800, 0.12223],
        [11, -0.2306, 8.7192, 0.12247],
        [12, -0.2497, 8.9481, 0.12268],
        [15, -0.3089, 9.6298, 0.12309],
        [18, -0.3700, 10.2849, 0.12349],
        [21, -0.4321, 10.9371, 0.12394],
        [24, -0.4952, 11.5939, 0.12446]
    ]
};

// Interpolate LMS values for given age
function interpolateLMS(age, gender) {
    const data = WHO_WEIGHT_DATA[gender];
    
    // Find the two closest age points
    let lowerIndex = 0;
    let upperIndex = data.length - 1;
    
    for (let i = 0; i < data.length - 1; i++) {
        if (age >= data[i][0] && age <= data[i + 1][0]) {
            lowerIndex = i;
            upperIndex = i + 1;
            break;
        }
    }
    
    const lowerAge = data[lowerIndex][0];
    const upperAge = data[upperIndex][0];
    
    if (lowerAge === upperAge) {
        return {
            L: data[lowerIndex][1],
            M: data[lowerIndex][2],
            S: data[lowerIndex][3]
        };
    }
    
    const ratio = (age - lowerAge) / (upperAge - lowerAge);
    
    return {
        L: data[lowerIndex][1] + ratio * (data[upperIndex][1] - data[lowerIndex][1]),
        M: data[lowerIndex][2] + ratio * (data[upperIndex][2] - data[lowerIndex][2]),
        S: data[lowerIndex][3] + ratio * (data[upperIndex][3] - data[lowerIndex][3])
    };
}

// Calculate Z-score using LMS method
function calculateZScore(weight, age, gender) {
    const lms = interpolateLMS(age, gender);
    const L = lms.L;
    const M = lms.M;
    const S = lms.S;
    
    if (L !== 0) {
        return (Math.pow(weight / M, L) - 1) / (L * S);
    } else {
        return Math.log(weight / M) / S;
    }
}

// Convert Z-score to percentile using approximation
function zScoreToPercentile(z) {
    // Using the cumulative distribution function approximation
    // This is a simplified version of the error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z);
    
    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
    
    const percentile = 0.5 * (1.0 + sign * y) * 100;
    return Math.round(percentile * 10) / 10; // Round to 1 decimal place
}

// Main calculation function
function calculateWeightPercentile(weight, ageMonths, gender) {
    try {
        // Validate inputs
        if (ageMonths < 0 || ageMonths > 24) {
            throw new Error('Age must be between 0 and 24 months');
        }
        
        if (weight < 1 || weight > 20) {
            throw new Error('Weight must be between 1 and 20 kg');
        }
        
        const zScore = calculateZScore(weight, ageMonths, gender);
        const percentile = zScoreToPercentile(zScore);
        
        return {
            percentile: percentile,
            zScore: zScore,
            interpretation: getInterpretation(percentile)
        };
    } catch (error) {
        throw error;
    }
}

// Get interpretation of percentile result
function getInterpretation(percentile) {
    if (percentile < 3) {
        return 'Below normal range (underweight). Please consult with a healthcare provider.';
    } else if (percentile >= 3 && percentile <= 97) {
        return 'Within normal range for age and gender.';
    } else {
        return 'Above normal range (overweight). Please consult with a healthcare provider.';
    }
}

// DOM manipulation and event handling
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('percentile-form');
    const resultSection = document.getElementById('result');
    const percentileValue = document.getElementById('percentile-value');
    const resultInterpretation = document.getElementById('result-interpretation');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const gender = document.getElementById('gender').value;
        const ageMonths = parseFloat(document.getElementById('age-months').value);
        const weight = parseFloat(document.getElementById('weight').value);
        
        try {
            const result = calculateWeightPercentile(weight, ageMonths, gender);
            
            // Display results
            percentileValue.textContent = result.percentile + 'th';
            resultInterpretation.textContent = result.interpretation;
            
            // Add color coding based on percentile
            percentileValue.className = 'percentile-number';
            if (result.percentile < 3) {
                percentileValue.classList.add('low');
            } else if (result.percentile > 97) {
                percentileValue.classList.add('high');
            } else {
                percentileValue.classList.add('normal');
            }
            
            resultSection.style.display = 'block';
            resultSection.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
    
    // Add real-time validation
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            this.setCustomValidity('');
        });
    });
});