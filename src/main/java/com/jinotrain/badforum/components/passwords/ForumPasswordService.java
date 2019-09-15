package com.jinotrain.badforum.components.passwords;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ForumPasswordService
{
    @Autowired
    protected List<PasswordHasher> passwordHashers;

    public boolean passwordMatches(String password, String checkhash)
    {
        if (password == null || checkhash == null) { return false; }

        for (PasswordHasher hasher: passwordHashers)
        {
            if (hasher.hashMatches(password, checkhash)) { return true; }
        }

        return false;
    }

    public String hashPassword(String password)
    {
        PasswordHasher hasher = passwordHashers.get(0);
        return hasher.hashAndPrefix(password);
    }
}
