'use strict'

/** mbti compatability matrix helper func
 *
 * approximate type matching data reference: https://personalitynft.com
 */

const compatibilityMatrix = {
    ISTJ: ["ESFP", "ESTP"],
    ISFJ: ["ESFP", "ESTP"],
    INFJ: ["ENFP", "ENTP"],
    INTJ: ["ENFP", "ENTP"],
    ISTP: ["ESFJ", "ENFJ"],
    ISFP: ["ESTJ", "ENTJ"],
    INFP: ["ENTJ", "ENFJ"],
    INTP: ["ENTJ", "ENFJ"],
    ESTP: ["ISFJ", "ISTJ"],
    ESFP: ["ISFJ", "ISTJ"],
    ENFP: ["INFJ", "INTJ"],
    ENTP: ["INFJ", "INTJ"],
    ESTJ: ["ISFP", "INFP"],
    ESFJ: ["ISTP", "INTP"],
    ENFJ: ["ISTP", "INTP"],
    ENTJ: ["INFP", "ISFP"]
};

// get compatible mbti types for a given mbti type
const getCompatibilityTypes = (mbti) => {
    return compatibilityMatrix[mbti] || [];
}

// validate if the provided mbti type is valid
const isValidMbtiType = (mbti) => {
    return mbti in compatibilityMatrix; // use 'key' from matrix
}

module.exports = { getCompatibilityTypes, isValidMbtiType };