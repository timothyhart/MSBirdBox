#include <cstring>
#include <sstream>

#include "shared/util.h"

namespace Util {

int CaseInsensitiveStringCompare(const std::string& lhs, const std::string& rhs)
{
#ifdef _MSC_VER
    return _stricmp(lhs.c_str(), rhs.c_str());
#else
    return strcasecmp(lhs.c_str(), rhs.c_str());
#endif
}

bool CaseInsensitiveStringsEqual(const std::string& lhs, const std::string& rhs)
{
    return CaseInsensitiveStringCompare(lhs, rhs);
}


std::vector<std::string> SplitString(const std::string& str, char delim)
{
#if 0
    std::stringstream ss(str);

    std::vector<std::string> tokens;
    std::string token;

    while (std::getline(ss, token, delim))
        tokens.push_back(token);

    return tokens;
#else
    
    std::vector<std::string> tokens;
    
    std::string currentToken;

    for (size_t i = 0; i < str.length(); i++)
    {
        char c = str[i];
        if (c != delim)
        {
            currentToken += c;
        }
        else
        {
            tokens.emplace_back(currentToken);
            currentToken.clear();
        }
    }

    tokens.emplace_back(currentToken);
    return tokens;

#endif
}

}   // namespace Util
