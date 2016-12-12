#pragma once

#include <string>
#include <vector>

#include "shared/common.h"

namespace Util {

// Lexicographically compare two strings, ignoring case.
int CaseInsensitiveStringCompare(const std::string& lhs, const std::string& rhs);

// Strings are equivalent, ignoring case.
bool CaseInsensitiveStringsEqual(const std::string& lhs, const std::string& rhs);

// Splits a string into a list of strings, separated by delim.
std::vector<std::string> SplitString(const std::string& str, char delim);

}