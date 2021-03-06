
/*
 * make it so:
   {
        "announce": ...,
        "info": { ... },
        "signatures": {
            "net.thingtracker": {
                "certificate": optional, DER encoded x.509 certificate,
                "info": { ... } optional,
                "signature": signed data = info + sig info if present
            },
            ...
        }
    }

 */

function hex2buffer (s)
{
    var i;
    var j;
    var view;
    var ret;
    
    limit = s.length;
    ret = new ArrayBuffer (limit / 2);
    view = new Uint8Array (ret);
    for (i = 0, j = 0; i < limit; i += 2)
        view[j++] = HexConverter.hex2dec (s.substr (i, 2));

    return (ret);
}

function SignTorrent (torrent, privatekey, certificate, version, nonce, next_nonce)
{
    var rsa = new RSAKey ();
    rsa.readPrivateKeyFromPEMString (privatekey);

    var info = torrent["info"];
    // create the second info section
    // ToDo: should the sha1 hashes be binary ?
    var info2 = {};
    var sigs = torrent["signatures"] || {};
    var oldsig = sigs["net.thingtracker"] || {};
    var oldinfo = oldsig["info"] || {};
    var oldancestors = oldinfo["ancestors"] || {};
    var oldcurrent = oldinfo["current"] || {};
    var oldsecret = oldinfo["descendent"] || {};

    // move current to ancestor status
    if (oldcurrent)
        for (var oldversion in oldcurrent)
            if (oldcurrent.hasOwnProperty (oldversion))
                oldancestors[oldversion] = oldcurrent[oldversion];
    info2["ancestors"] = oldancestors;

    var check = sha1 (nonce);
    if (oldsecret["hash"])
        if (oldsecret["hash"] != check)
        {
            alert ("Hash for nonce \"" + nonce + "\" does not agree with secret hash " + oldsecret["hash"]);
            return;
        }
    
    var me = {};
    me[version] = {};
    if ("" != nonce)
    {
        me[version]["nonce"] = nonce;
        me[version]["hash"] = check;
    }
    me[version]["id"] = info_hash (info);
    info2["current"] = me;
    
    var secret = {};
    secret["hash"] = sha1 (next_nonce);
    info2["descendent"] = secret;
    
    // sign the two encoded info sections
    // ToDo: check the signature produced here against the one generated by ut-signing-tool (https://github.com/bittorrent/ut-signing-tool)
    var i1 = str2ab (encode (info));
    var i2 = str2ab (encode (info2));
    var i12 = new ArrayBuffer (i1.byteLength + i2.byteLength);
    var view1 = new Uint8Array (i1);
    var view2 = new Uint8Array (i2);
    var view12 = new Uint8Array (i12);
    for (var i = 0; i < i1.byteLength; i++)
        view12[i] = view1[i];
    for (var i = 0; i < i2.byteLength; i++)
        view12[i1.byteLength + i] = view2[i1.byteLength + i];
    // and now convert it back to a string for RSAKey
    var text = "";
    for (var i = 0; i < i12.byteLength; i++)
        text += String.fromCharCode (view12[i]);

    var signature = hex2buffer (rsa.signString (text, "sha1"));
    
    var sig = {};
    if ((null != certificate) && ("" != certificate))
    {
        // DER encode the PEM encoded x.509 certificate:
        sig["certificate"] = hex2buffer (X509.pemToHex (certificate));
    }
    sig["info"] = info2;
    sig["signature"] = signature;
    sigs["net.thingtracker"] = sig;
    torrent["signatures"] = sigs;
}