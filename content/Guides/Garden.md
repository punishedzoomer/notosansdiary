---
title: How I Built & Customized My Quartz Digital Garden
---
## Challenges I faced making this garden 

I am making this writeup because nearly every quartz based website I consulted while making this site was based on versions less than Quartz V5 . 

I have been an obsidian user for quite a while now , and just last year was when I discovered this project . I was watching **youtube** and this [video popped up](https://www.youtube.com/watch?v=NSTT2iBSwZs) and I remember being jealous at this guy's site and that's how i got into [Quartz](https://github.com/jackyzha0/quartz) .  

After putting it off for months i finally got to work . 

## Issue no.1

Every blog i found had the outdated version, so I actually quite struggled with simple things until I decided to use **Antigravity** (never in my life have i thought that I would be thanking an AI).  
 SO for starters , you will need to install a theme you like . 
Check this repository , it has all the obsidian themes and they made them compatible with quartz. 

- [Quartz themes](https://github.com/saberzero1/quartz-themes) : Check this repo for themes . 


but I then noticed a bug when I opened all the themes from this site . 

SO basically on the explorer button was broken whenever I folded it . 

```image-layout-a
![[Garden.png]]
![[how it's supposed to look like.png]]
```

So I went ahead and changed this code in this file 

```scss title="quartz/styles/custom.scss"
.explorer {
  display: flex;
  flex-direction: column;
  overflow-y: hidden;
  min-height: 1.5rem;
  flex: 0 1 auto;

  &.collapsed {
    flex: 0 1 auto; // Prevents cutting off text
    
    & .fold {
      transform: rotateZ(-90deg);
    }
  }
}
```



